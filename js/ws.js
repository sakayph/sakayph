var geocoder = function() {
  var scriptDeferred = Q.defer();
  scriptDeferred.resolve(new google.maps.Geocoder());

  function callGeocode(options) {
    var requestDeferred = Q.defer();
    scriptDeferred.promise.then(function(geocoder) {
      geocoder.geocode(options, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          requestDeferred.resolve(results);
        }
        else {
          requestDeferred.reject(results);
        }
      });
    });
    return requestDeferred.promise;
  }

  return {
    fromName: Q.fbind(function(query, bounds) {
      return callGeocode({
        address: query,
        region: 'ph',
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(bounds.getWest(), bounds.getSouth()),
          new google.maps.LatLng(bounds.getEast(), bounds.getNorth())
        )
      });
    }),
    fromLatLng: Q.fbind(function(latlng) {
      return callGeocode({
        latLng: new google.maps.LatLng(latlng.lat, latlng.lng)
      });
    })
  }
}();

var otp = function() {
  var API = 'http://maps.pleasantprogrammer.com/opentripplanner-api-webapp/ws'

  function callApi(endpoint, data) {
    return Q(reqwest({
      url: API+endpoint,
      type: 'jsonp',
      data: data
    }));
  }

  return {
    metadata: callApi('/metadata'),
    route: function(from, to, mode) {
      var d = new Date();
      return callApi('/plan', {
        date: d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(),
        time: '11:59am',
        mode: mode,
        fromPlace: from.lat+','+from.lng,
        toPlace: to.lat+','+to.lng
      })
    }
  }
}();

var sakay = function() {
  var API = 'http://sms.sakay.ph/api';

  function callApi(endpoint, data) {
    return Q(reqwest({
      method: 'post',
      url: API+endpoint,
      data: data,
      type: 'text'
    }));
  }

  return {
    canLog: function() {
      return localStorage.getItem('disallow_log') != 'true';
    },
    setCanLog: function(val) {
      localStorage.setItem('disallow_log', !val);
    },
    log: function(fromName, fromTarget, toName, toTarget) {
      callApi('/log', {
        fromName: fromName,
        fromLat: fromTarget.lat,
        fromLng: fromTarget.lng,
        toName: toName,
        toLat: toTarget.lat,
        toLng: toTarget.lng
      });
    },
    send: function(number, itinerary) {
      return callApi('/send', {
        target: number,
        itinerary: JSON.stringify(itinerary, function(key, value) {
          if(key == '_ractive') return undefined;
          if(key == 'points') return undefined;
          if(key == 'polyline') return undefined;
          return value;
        })
      });
    }
  }
}();
