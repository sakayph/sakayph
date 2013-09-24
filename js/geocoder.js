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
