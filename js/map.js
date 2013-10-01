/*
 * Copyright 2013 Thomas Dy, Philip Cheang under the terms of the
 * MIT license found at http://sakay.ph/LICENSE
 */
var map = L.map('map');
map.addLayer(new L.Google('ROADMAP'));

otp.metadata.then(function(data) {
  map.setView([data.centerLatitude, data.centerLongitude], 12);
});

var progress = new Ractive({
  el: '#progress',
  template: '#progressWidgetTemplate'
})
progress.setLoading = function(loading) {
  this.set('loading', loading);
}

var smsWidget = new Ractive({
  el: '#sms',
  template: '#smsWidgetTemplate'
});

smsWidget.on('send', function() {
  new SendModal();
});

var search = new Ractive({
  el: '#search',
  template: '#searchTemplate',
  data: {
    targets: {
      mode: 'TRANSIT,WALK'
    }
  }    
});
search.layer = L.layerGroup([]).addTo(map);

search.addInput = function(id, target) {
  var input = document.getElementById(id);
  var searchBox = new google.maps.places.SearchBox(input);

  google.maps.event.addListener(searchBox, 'places_changed', function() {
    search.layer.clearLayers();
    var places = searchBox.getPlaces();
    if(places.length > 0) {
      var place = places[0];
      var latlng = g2lLatLng(place.geometry.location);
      var marker = L.marker(latlng);
      var popup = new Popup(marker);
      marker.addTo(search.layer);
      setTimeout(function() {
        map.setView(latlng, 14);
      }, 0);
      search.setTarget(target, latlng, true);
    }
    viewMode("map");
  });

  // sorry thomas, I'll clean this up

  search.on('go', function() {
    search.layer.clearLayers();
    var places = searchBox.getPlaces();
    if(places.length > 0) {
      var place = places[0];
      var latlng = g2lLatLng(place.geometry.location);
      var marker = L.marker(latlng);
      var popup = new Popup(marker);
      marker.addTo(search.layer);
      setTimeout(function() {
        map.setView(latlng, 14);
      }, 0);
      search.setTarget(target, latlng, true);
    }
    viewMode("map")
  });

  map.on('moveend', function() {
    var bounds = l2gBounds(map.getBounds());
    searchBox.setBounds(bounds);
  });
}

search.setTarget = function(name, latlng, address) {
  var a = name;
  var b = "to";
  if(a == "to") {
    b = "from";
  }

  var targets = search.get('targets');

  var marker;
  if(targets[a]) {
    marker = targets[a];
    marker.setLatLng(latlng);
    marker.unbindPopup();
  }
  else {
    marker = L.marker(latlng);
  }

  var popup = new Popup(marker);

  if(!targets[a]) {
    marker.addTo(map);
    targets[a] = marker;
  }

  if(!address) {
    geocoder.fromLatLng(latlng).then(function(data) {
      var address = data[0].formatted_address;
      document.getElementById(a).value = address;
    });
  }

  if(targets[b]) {
    if(targets[b].getLatLng() == latlng) { // handle setting start as destination
      map.removeLayer(targets[b]);
      targets[b] = null;
    }
  }
  search.update('targets');
  map.closePopup();
}

search.observe('targets', function(targets) {
  if(!targets.from || !targets.to) return;
  var self = this;
  progress.setLoading(true);

  if(sakay.canLog()) {
    var fromName = document.getElementById('from').value;
    var toName = document.getElementById('to').value;

    sakay.log(fromName, targets.from.getLatLng(), toName, targets.to.getLatLng());
  }

  otp.route(
    targets.from.getLatLng(),
    targets.to.getLatLng(),
    targets.mode
  )
  .then(function(data) {
    router.reset();
    if(data.plan) {
      var results = data.plan.itineraries;
      results.forEach(function(itinerary) {
        itinerary.legs = itinerary.legs.filter(function(leg) {
          // because these really aren't that worth it to display
          return leg.duration > 60000;
        }).filter(function(leg) {
          // because OTP sometimes gives bus routes that are non-sensical
          return leg.mode == "WALK" || leg.distance >= 500;
        });

        var incomplete = false;
        itinerary.fare = 0;
        itinerary.legs.forEach(function(leg) {
          leg.points = decodePoints(leg.legGeometry.points);
          if(leg.mode == 'BUS' && leg.routeId.indexOf('PUJ') >= 0) {
            leg.mode = 'JEEP';
          }
          leg.className = leg.mode.toLowerCase();

          if(leg.mode == 'RAIL') {
            leg.route = leg.route.replace("-", " ");
            leg.className = "rail "+leg.route.replace(" ", "").toLowerCase();
          }

          if(leg.routeId == "ROUTE_880872") {
            incomplete = true;
          }

          leg.fare = calculateFare(leg);
          if(leg.fare) {
            itinerary.fare += leg.fare;
            leg.fare = formatFare(leg.fare);
          }
        });

        if(itinerary.fare == 0) {
          itinerary.fare = undefined;
        }
        else {
          itinerary.fare = formatFare(itinerary.fare, incomplete);
        }
      });
      router.set('results', results);
      router.set('selected', -1);
      router.set('selected', 0);
    }
    else {
      router.set('results', null);
      itinerary.set('current', null);
    }
  })
  .fin(function() {
    progress.setLoading(false);
  });
});

search.on({
  swap: function(event) {
    var targets = this.get('targets');
    var tmp = targets.from;
    targets.from = targets.to;
    targets.to = tmp;

    var fromInput = document.getElementById('from');
    var toInput = document.getElementById('to');
    tmp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = tmp;
    this.update('targets');
  },
});

search.addInput('from', 'from');
search.addInput('to', 'to');

var TrackModal = (function() {
  var _class = Ractive.extend({
    template: '#trackWidgetTemplate',
    append: true,
    data: {
      disallowTracking: !sakay.canLog()
    },
    init: function() {
      var modalStyle = this.el.style;
      modalStyle.width = '500px';
      modalStyle.margin = "0 0 0 "+(-this.el.clientWidth / 2)+"px";
      this.observe('disallowTracking', function(val) {
        sakay.setCanLog(!val);
      });
    }
  });

  return function() {
    var modal = picoModal({
      content: document.getElementById('trackingInfo').innerHTML,
      modalStyles: {}
    });
    return new _class({
      el: modal.modalElem
    });
  }
})();

var SendModal = (function() {
  var _class = Ractive.extend({
    template: '#modalTemplate',
    init: function(options) {
      var self = this;
      var modalStyle = self.el.style;
      modalStyle.width = 'auto';
      modalStyle.margin = "0 0 0 "+(-self.el.clientWidth / 2)+"px";
      this.on({
        send: function() {
          this.set('sending', true);
          sakay.send(self.get('number'), itinerary.get('current')).then(function() {
            options.modal.close();
            picoModal({
              content: "Your message will be sent in a short while.",
              modalStyles: {}
            });
          });
        }
      });
    }
  });

  return function(itinerary) {
    var modal = picoModal({
      closeButton: false,
      modalStyles: {}
    });
    return new _class({
      el: modal.modalElem,
      modal: modal
    });
  }
})();

var Popup = (function() {
  var _class = Ractive.extend({
    template: '#popupTemplate',
    init: function() {
      var self = this;

      function setSomething(a, b) {
        return function(event) {
          var latlng = this.get('latlng');
          search.setTarget(a, latlng, false);
        }
      }

      this.on({
        setStart: setSomething('from', 'to'),
        setEnd: setSomething('to', 'from')
      });

      geocoder.fromLatLng(self.get('latlng')).then(function(data) {
        var address = data[0].formatted_address;
        self.set('address', address);
      });
    },
    open: function() {
      map.openPopup(this.el, this.get('latlng'));
    },
    bindTo: function(marker) {
      marker.bindPopup(this.el);
    }
  });
  return function(pos) {
    var latlng = pos;
    if(pos.constructor == L.Marker) {
      latlng = pos.getLatLng();
    }
    var popup = new _class({
      el: document.createElement('div'),
      data: {
        latlng: latlng
      }
    });
    if(pos.constructor == L.Marker) {
      popup.bindTo(pos);
    }
    return popup;
  }
})();

map.on('contextmenu', function(event) {
  var popup = new Popup(event.latlng);
  popup.open();
});

var itinerary = new Ractive({
  el: '#itinerary',
  template: '#itineraryTemplate',
  debug: true,
  data: {
    f: formatDuration,
    formatDirection: function(dir) {
      if(dir == undefined) return '';
      return dir.toLowerCase().replace('_', ' ');
    },
    isTransit: function(mode) {
      return mode == 'JEEP' || mode == 'BUS' || mode == 'RAIL';
    },
  }
});
itinerary.markerLayer = L.layerGroup([]).addTo(map);
itinerary.observe('current', function(val, oldVal) {
  smsWidget.el.className = (val == undefined) ? 'hidden' : '';

  if(val) {
    itinerary.markerLayer.clearLayers();
    val.legs.forEach(function(leg, index) {
      if(index == 0) return;
      leg.marker = L.marker([leg.from.lat, leg.from.lon]);
      leg.marker.setOpacity(0);
      itinerary.markerLayer.addLayer(leg.marker);
    });
  }
  if(oldVal) {
    oldVal.legs.forEach(function(leg, index) {
      leg.marker = undefined;
    });
  }
});

itinerary.on({
  showSteps: function(event) {
    var path = event.keypath+'.showSteps';
    this.set(path, !this.get(path));
  },
  hover: function(event, index) {
    var leg = this.get('current').legs[index];
    if(event.hover) {
      if(leg.polyline == undefined) {
        leg.polyline = L.polyline(leg.points, {
          color: 'yellow',
          weight: 7
        });
      }
      leg.polyline.addTo(router.layer);
    }
    else {
      map.removeLayer(leg.polyline);
    }
  }
});

var router = new Ractive({
  el: '#routes',
  template: '#routerTemplate',
  debug: true,
  data: {
    f: formatDuration,
  }
});
router.layer = L.layerGroup([]).addTo(map);
router.reset = function() {
  this.layer.clearLayers();
  this.routeLine = L.multiPolyline([]).addTo(this.layer);
}
router.getPoints = function(index) {
  var results = this.get('results');
  var lines = [];
  results[index].legs.forEach(function(leg) {
    lines.push(leg.points);
  });
  return lines;
}
router.showRoute = function(index) {
  this.routeLine.setLatLngs(this.getPoints(index));
  this.unhighlightRoute(index);
  map.fitBounds(this.routeLine.getBounds(), { paddingTopLeft: [300, 10], paddingBottomRight: [10, 10] });
}
router.highlightRoute = function(index) {
  var route = this.get('results')[index];
  if(route.polyline == undefined) {
    route.polyline = L.multiPolyline(this.getPoints(index), {
      color: 'red'
    });
  }
  route.polyline.addTo(this.layer);
}
router.unhighlightRoute = function(index) {
  var polyline = this.get('results')[index].polyline;
  if(this.layer.hasLayer(polyline)) {
    this.layer.removeLayer(polyline);
  }
}

router.observe('selected', function(val) {
  if(val == undefined || val < 0) return;
  var results = this.get('results');
  itinerary.set('current', results[val]);
  this.showRoute(val);
});

router.on({
  select: function(event, index) {
    this.set('selected', index);
  },
  hover: function(event, index) {
    if(index != this.get('selected')) {
      if(event.hover) {
        this.highlightRoute(index);
      }
      else {
        this.unhighlightRoute(index);
      }
    }
  }
});

