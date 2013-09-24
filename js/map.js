var map = L.map('map');
map.addLayer(new L.Google('ROADMAP'));

otp.metadata.then(function(data) {
  map.setView([data.centerLatitude, data.centerLongitude], 12);
});

var progress = new Ractive({
  el: '#search',
  append: true,
  template: ' {{#loading}}loading{{/loading}}'
})
progress.setLoading = function(loading) {
  this.set('loading', loading);
}

var search = new Ractive({
  el: '#search',
  template: '#searchTemplate',
});
search.layer = L.layerGroup([]).addTo(map);

search.on({
  clearSearch: function(event) {
    this.layer.clearLayers();
  },
});

(function() {
  var self = search;
  var input = document.getElementById("query");
  var searchBox = new google.maps.places.SearchBox(input);

  google.maps.event.addListener(searchBox, 'places_changed', function() {
    search.fire('clearSearch');
    var places = searchBox.getPlaces();
    var first = true;
    places.forEach(function(place) {
      var latlng = g2lLatLng(place.geometry.location);
      var marker = L.marker(latlng);
      var popup = new Popup(marker);
      marker.addTo(self.layer);
      if(first) {
        marker.openPopup();
        map.setView(latlng, 14);
      }
    });
  });

  map.on('moveend', function() {
    var bounds = l2gBounds(map.getBounds());
    searchBox.setBounds(bounds);
  });
})();


var Popup = (function() {
  var _class = Ractive.extend({
    template: '#popupTemplate',
    init: function() {
      var self = this;

      function setSomething(a, b) {
        return function(event) {
          var targets = router.get('targets');
          search.fire('clearSearch');
          var latlng = this.get('latlng');

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

          geocoder.fromLatLng(self.get('latlng')).then(function(data) {
            var address = data[0].formatted_address;
            router.set('targets.'+a+'Address', address);
          });

          if(targets[b]) {
            if(targets[b].getLatLng() == latlng) { // handle setting start as destination
              map.removeLayer(targets[b]);
              targets[b] = null;
            }
          }
          router.update('targets');
          map.closePopup();
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
})

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
        itinerary.legs.forEach(function(leg) {
          leg.points = decodePoints(leg.legGeometry.points);
          if(leg.mode == 'BUS' && leg.routeId.indexOf('PUJ') >= 0) {
            leg.mode = 'JEEP';
          }

          if(leg.mode == 'BUS') {
            leg.fare = calculateFare(leg.distance, 'pub_aircon', false);
          }
          else if(leg.mode == 'JEEP') {
            leg.fare = calculateFare(leg.distance, 'puj', false);
          }
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
    tmp = targets.fromAddress;
    targets.fromAddress = targets.toAddress;
    targets.toAddress = tmp;
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
