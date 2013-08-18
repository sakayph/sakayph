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
