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
      url: API+endpoint,
      type: 'jsonp',
      data: data
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
    }
  }
}();
