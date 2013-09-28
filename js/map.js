var map = L.map('map');
map.addLayer(new L.Google('ROADMAP'));

otp.metadata.then(function(data) {
  map.setView([data.centerLatitude, data.centerLongitude], 12);
});

var progress = new Ractive({
  el: '#routes',
  append: true,
  template: ' {{#loading}}loading{{/loading}}'
})
progress.setLoading = function(loading) {
  this.set('loading', loading);
}

var trackWidget = new Ractive({
  el: '#track',
  append: true,
  template: '<input type="checkbox" checked="{{disallowTracking}}"> I don\'t want to be tracked',
  data: {
    disallowTracking: !sakay.canLog()
  }
});

trackWidget.observe('disallowTracking', function(val) {
  sakay.setCanLog(!val);
});

var search = {};
search.layer = L.layerGroup([]).addTo(map);

function addSearch(id, target) {
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
      router.setTarget(target, latlng, true);
    }
  });

  map.on('moveend', function() {
    var bounds = l2gBounds(map.getBounds());
    searchBox.setBounds(bounds);
  });
}

var Popup = (function() {
  var _class = Ractive.extend({
    template: '#popupTemplate',
    init: function() {
      var self = this;

      function setSomething(a, b) {
        return function(event) {
          var latlng = this.get('latlng');
          router.setTarget(a, latlng, false);
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
    targets: {
      mode: 'TRANSIT,WALK'
    }
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
  map.fitBounds(this.routeLine.getBounds(), { padding: [10, 10] });
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

router.setTarget = function(name, latlng, address) {
  var a = name;
  var b = "to";
  if(a == "to") {
    b = "from";
  }

  var targets = router.get('targets');

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
  router.update('targets');
  map.closePopup();
}

router.observe('selected', function(val) {
  if(val == undefined || val < 0) return;
  var results = this.get('results');
  itinerary.set('current', results[val]);
  this.showRoute(val);
});

router.observe('targets', function(targets) {
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
    self.reset();
    if(data.plan) {
      var results = data.plan.itineraries;
      results.forEach(function(itinerary) {
        itinerary.legs = itinerary.legs.filter(function(leg) {
          return leg.duration > 60000;
        });
        itinerary.legs.forEach(function(leg) {
          leg.points = decodePoints(leg.legGeometry.points);
          if(leg.mode == 'BUS' && leg.routeId.indexOf('PUJ') >= 0) {
            leg.mode = 'JEEP';
          }

          leg.fare = calculateFare(leg);
        });
      });
      self.set('results', results);
      self.set('selected', -1);
      self.set('selected', 0);
    }
    else {
      self.set('results', null);
      itinerary.set('current', null);
    }
  })
  .fin(function() {
    progress.setLoading(false);
  });
});

router.on({
  select: function(event, index) {
    this.set('selected', index);
  },
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

addSearch('from', 'from');
addSearch('to', 'to');

