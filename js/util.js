/*
 * Copyright 2013 Thomas Dy, Philip Cheang under the terms of the
 * MIT license found at http://sakay.ph/LICENSE
 */
function formatFare(fare, incomplete) {
  var f = fare.toFixed(2).replace(".00", "");
  if(incomplete) {
    f = f + "*";
  }
  return f;
}

function formatDuration(duration) {
  if(isNaN(duration)) return '';
  var minutes = Math.floor(duration / 1000 / 60);
  var hours = Math.floor(minutes / 60);

  if(minutes == 0) {
    return '< 1 min'
  }
  else if(minutes % 60 == 0) {
    if(hours > 1) {
      return hours+' hours';
    }
    else {
      return '1 hour';
    }
  }
  else if(minutes > 60) {
    return hours+'h '+(minutes % 60)+'m'; 
  }
  else {
    return minutes+' min';
  }
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
// adapted from http://soulsolutions.com.au/Default.aspx?tabid=96
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

}

function refitMap () {
  map.invalidateSize();
}


