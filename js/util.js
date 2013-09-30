function formatDuration(duration) {
  if(isNaN(duration)) return '';
  var minutes = Math.floor(duration / 1000 / 60);

  function helper(minutes) {
    if(minutes <= 0) {
      return '';
    }
    else if(minutes == 1) {
      return '1 minute';
    }
    else if(minutes < 60) {
      return minutes+' minutes'
    }
    else {
      var hours = Math.floor(minutes / 60);
      var tail = helper(minutes % 60);
      if(tail != '') tail = ' and '+tail;
      if(hours == 1) {
        return '1 hour'+tail;
      }
      else {
        return hours+' hours'+tail;
      }
    }
  }

  return helper(minutes);
}

/* Converting Google to Leaflet */
function g2lBounds(gBounds) {
  return new L.LatLngBounds(
    g2lLatLng(gBounds.getSouthWest()),
    g2lLatLng(gBounds.getNorthEast())
  );
}

function g2lLatLng(gLatLng) {
  return new L.LatLng(gLatLng.lat(), gLatLng.lng());
}

/* Converting Leaflet to Google */
function l2gBounds(bounds) {
  return new google.maps.LatLngBounds(
    l2gLatLng(bounds.getSouthWest()),
    l2gLatLng(bounds.getNorthEast())
  );
}

function l2gLatLng(latlng) {
  return new google.maps.LatLng(latlng.lat, latlng.lng);
}

/* Decoding OTP polylines */
function decodeNumber(value, index) {
  if (value.length == 0)
      throw "string is empty";

  var num = 0;
  var v = 0;
  var shift = 0;

  do {
    v1 = value.charCodeAt(index++);
    v = v1 - 63;
    num |= (v & 0x1f) << shift;
    shift += 5;
  } while (v >= 0x20);

  return {"number": num, "index": index};
}

function decodeSignedNumber(value,index) {
    var r = decodeNumber(value, index);
    var sgn_num = r.number;
    if ((sgn_num & 0x01) > 0) {
      sgn_num = ~(sgn_num);
    }
    r.number = sgn_num >> 1;
    return r;
}

function decodePoints(n) {
  var lat = 0;
  var lon = 0;

  var strIndex = 0;
  var points = new Array();

  while (strIndex < n.length) {

    var rLat = decodeSignedNumber(n, strIndex);
    lat = lat + rLat.number * 1e-5;
    strIndex = rLat.index;

    var rLon = decodeSignedNumber(n, strIndex);
    lon = lon + rLon.number * 1e-5;
    strIndex = rLon.index;

    var p = new L.LatLng(lat,lon);
    points.push(p);
  }

  return points;
}

function viewMode(input) {
  
  var body = document.body;

  if (input === "map") {
    if (body.className === "") {
      body.className = "mapmode";
    }
  }

  if (input === "home") {
    if (body.className === "mapmode") {
      body.className = "";
    }
  }

  if (input === "toggle") {
    if (body.className === "") {
      body.className = "mapmode";
    } else {
      body.className = "";
    }
  }

  var evt = document.createEvent('UIEvents');
  evt.initUIEvent('resize', true, false,window,0);
  window.dispatchEvent(evt);
}


