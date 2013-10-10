/*
 * Copyright 2013 Thomas Dy, Philip Cheang under the terms of the
 * MIT license found at http://sakay.ph/LICENSE
 */

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

  google.maps.event.addListener(searchBox, 'places_changed', function() {
    var places = searchBox.getPlaces();
    if(places.length > 0) {
      var place = places[0];
      var latlng = g2lLatLng(place.geometry.location);
      var marker = L.marker(latlng);
      search.setTarget(target, latlng, true);
    }
    viewMode("map");
  });

  // sorry thomas, I'll clean this up

  search.on('go', function() {
    var places = searchBox.getPlaces();
    if(places.length > 0) {
      var place = places[0];
      var latlng = g2lLatLng(place.geometry.location);
      var marker = L.marker(latlng);
      search.setTarget(target, latlng, true);
    }
    viewMode("map")
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
  }
  else {
    marker = L.marker(latlng);
  }


  if(!targets[a]) {
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
      targets[b] = null;
    }
  }
  search.update('targets');
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
            });
          });
        }
      });
    }
  });

  return function(itinerary) {
    var modal = picoModal({
      closeButton: false,
    });
    return new _class({
      el: modal.modalElem,
      modal: modal
    });
  }
})();

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
  sendSMS: function() {
    if(itinerary.get('current')) {
      new SendModal();
    }
    else {
      picoModal("Search for a route and we can send the directions to you via SMS.");
    }
  },
  showSteps: function(event) {
    var path = event.keypath+'.showSteps';
    var isShowing = this.get(path);
    this.set(path, !isShowing);
  },
});

var router = new Ractive({
  el: '#routes',
  template: '#routerTemplate',
  debug: true,
  data: {
    f: formatDuration,
  }
});

router.observe('selected', function(val) {
  if(val == undefined || val < 0) return;
  var results = this.get('results');
  itinerary.set('current', results[val]);
});

router.on({
  select: function(event, index) {
    this.set('selected', index);
  },
});

