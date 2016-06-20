/*
 * Copyright 2013 Thomas Dy, Philip Cheang under the terms of the
 * MIT license found at http://sakay.ph/LICENSE
 */
var map = L.map('map');
map.addLayer(new L.Google('ROADMAP'));

// give allowance for sidebar
var fitPadding = { paddingTopLeft: [300, 10], paddingBottomRight: [10, 10] };

var historyInitialized = false;

var progress = new Ractive({
  el: '#progress',
  template: '#progressWidgetTemplate'
})
progress.setLoading = function(loading) {
  this.set('loading', loading);
}

var search = new Ractive({
  el: '#search',
  template: '#searchTemplate',
  data: {
    targets: {
      mode: 'TRANSIT,WALK'
    }
  }
});

search.addInput = function(id, target) {
  var input = document.getElementById(id);
  var searchBox = new google.maps.places.SearchBox(input);
  var select = function() {
    var places = searchBox.getPlaces();
    var options = {};
    if(places != null && places.length > 0) {
      var place = places[0];
      var latlng = g2lLatLng(place.geometry.location);
      if(document.body.className != "mapmode") {
        options.animate = false;
      }
      map.setView(latlng, 14, options);
      search.setTarget(target, latlng, true);
    }
    viewMode("map", latlng);
  };

  google.maps.event.addListener(searchBox, 'places_changed', select);
  search.on('go', select);

  map.on('moveend', function() {
    var bounds = l2gBounds(map.getBounds());
    if(bounds.getNorthEast().equals(bounds.getSouthWest())) {
      bounds = undefined;
    }
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
      search.unsetTarget(b);
    }
  }
  search.update('targets');
  map.closePopup();
}

search.unsetTarget = function(target) {
  var targets = search.get('targets');
  if(targets[target]) {
    map.removeLayer(targets[target]);
    targets[target] = null;
  }
}

search.observe('targets', function(targets) {
  if(historyInitialized) {
    var params = buildUrlParams(targets);
    History.replaceState(null, document.title, params);
  }
  if(!targets.from || !targets.to) return;
  var self = this;
  progress.setLoading(true);

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
        itinerary.fare = 0;
        itinerary.legs.forEach(function(leg) {
          leg.points = decodePoints(leg.legGeometry.points);
          leg.className = leg.mode.toLowerCase();

          if(leg.mode == 'RAIL') {
            leg.route = leg.route.replace("-", " ");
            leg.className = "rail "+leg.route.replace(" ", "").toLowerCase();
          }
          if(leg.fare) {
            itinerary.fare += leg.fare;
            leg.fare = formatFare(leg.fare);
          }
        });

        if(itinerary.fare == 0) {
          itinerary.fare = undefined;
        }
        else {
          itinerary.fare = formatFare(itinerary.fare, false);
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

var printView = new Ractive({
  el: '#print',
  template: '#printTemplate',
  data: {
    show: false,
    results: [],
    selected: -1,
    loaded: [],
    f: formatDuration,
    formatDirection: function(dir) {
      if(dir == undefined) return '';
      return dir.toLowerCase().replace('_', ' ');
    },
    map: staticMaps,
    divLoaded: function(n) {
      return printView.get('loaded').indexOf(n) >= 0;
    },
    divClass: function(n, selected) {
      return (n == selected) ? '' : 'hidden';
    }
  }
});
printView.observe('results', function() {
  this.set('loaded', []);
});
printView.observe('selected', function(n) {
  this.get('loaded').push(n);
});
printView.on('back', function() {
  printView.set('show', false);
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
  print: function() {
    if(itinerary.get('current')) {
      printView.set('show', true);
      window.print();
    }
    else {
      picoModal("Search for a route first.");
    }
  },
  showSteps: function(event) {
    var path = event.keypath+'.showSteps';
    var isShowing = this.get(path);
    this.set(path, !isShowing);

    if(!isShowing) {
      path = event.keypath;
      var leg = this.get(path);
      map.fitBounds(leg.polyline.getBounds(), fitPadding);
    }
    else {
      var itinerary = this.get('current');
      var bounds = L.latLngBounds([]);
      itinerary.legs.forEach(function(leg) {
        bounds.extend(L.latLngBounds(leg.points));
      });
      map.fitBounds(bounds, fitPadding);
    }
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
  map.fitBounds(this.routeLine.getBounds(), fitPadding);
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

router.observe('results', function(val) {
  printView.set('results', val);
});

router.observe('selected', function(val) {
  if(val == undefined || val < 0) return;
  printView.set('selected', val);
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

(function() {
  function setTarget(target, latlng) {
    var valid = latlng != null;
    if(valid) {
      search.setTarget(target, latlng, false);
    }
    return valid;
  }

  var urlParams = getUrlParams();
  var fromLatLng = str2latlng(urlParams.from);
  var toLatLng = str2latlng(urlParams.to);

  if(fromLatLng && !toLatLng) {
    map.setView(fromLatLng, 14);
  }
  else if(toLatLng && !fromLatLng) {
    map.setView(toLatLng, 14);
  }
  else if(!fromLatLng && !toLatLng) {
    otp.metadata.then(function(data) {
      if(map.center == null) {
        map.setView([data.centerLatitude, data.centerLongitude], 12);
      }
    });
  }

  if(setTarget('from', fromLatLng) | setTarget('to', toLatLng)) {
    viewMode('map');
  }
  historyInitialized = true;
}());

