/*
 * Copyright 2013 Thomas Dy, Philip Cheang under the terms of the
 * MIT license found at http://sakay.ph/LICENSE
 */
var calculateFare = function() {
  var busFares = {
    pub_aircon: [
      { regular: 0, discounted: 0 },
      { regular: 12.00, discounted: 9.50 },
      { regular: 12.00, discounted: 9.50 },
      { regular: 12.00, discounted: 9.50 },
      { regular: 12.00, discounted: 9.50 },
      { regular: 12.00, discounted: 9.50 },
      { regular: 14.25, discounted: 11.25 },
      { regular: 16.50, discounted: 13.00 },
      { regular: 18.50, discounted: 15.00 },
      { regular: 20.75, discounted: 16.75 },
      { regular: 23.00, discounted: 18.50 },
      { regular: 25.25, discounted: 20.25 },
      { regular: 27.50, discounted: 22.00 },
      { regular: 29.50, discounted: 23.75 },
      { regular: 31.75, discounted: 25.50 },
      { regular: 34.00, discounted: 27.25 },
      { regular: 36.25, discounted: 29.00 },
      { regular: 38.50, discounted: 30.75 },
      { regular: 40.50, discounted: 32.50 },
      { regular: 42.75, discounted: 34.25 },
      { regular: 45.00, discounted: 36.00 },
      { regular: 47.25, discounted: 37.75 },
      { regular: 49.50, discounted: 39.50 },
      { regular: 51.50, discounted: 41.25 },
      { regular: 53.75, discounted: 43.00 },
      { regular: 56.00, discounted: 44.75 },
      { regular: 58.25, discounted: 46.50 },
      { regular: 60.50, discounted: 48.25 },
      { regular: 62.50, discounted: 50.00 },
      { regular: 64.75, discounted: 51.75 },
      { regular: 67.00, discounted: 53.50 },
      { regular: 69.25, discounted: 55.25 },
      { regular: 71.50, discounted: 57.00 },
      { regular: 73.50, discounted: 59.00 },
      { regular: 75.75, discounted: 60.75 },
      { regular: 78.00, discounted: 62.50 },
      { regular: 80.25, discounted: 64.25 },
      { regular: 82.50, discounted: 66.00 },
      { regular: 84.50, discounted: 67.75 },
      { regular: 86.75, discounted: 69.50 },
      { regular: 89.00, discounted: 71.25 },
      { regular: 91.25, discounted: 73.00 },
      { regular: 93.50, discounted: 74.75 },
      { regular: 95.50, discounted: 76.50 },
      { regular: 97.75, discounted: 78.25 },
      { regular: 100.00, discounted: 80.00 },
      { regular: 102.25, discounted: 81.75 },
      { regular: 104.50, discounted: 83.50 },
      { regular: 106.50, discounted: 85.25 },
      { regular: 108.75, discounted: 87.00 },
      { regular: 111.00, discounted: 88.75 },
      { regular: 113.25, discounted: 90.50 },
      { regular: 115.50, discounted: 92.25 },
      { regular: 117.50, discounted: 94.00 },
      { regular: 119.75, discounted: 95.75 },
      { regular: 122.00, discounted: 97.50 },
      { regular: 124.25, discounted: 99.25 },
      { regular: 126.50, discounted: 101.00 },
      { regular: 128.50, discounted: 103.00 },
      { regular: 130.75, discounted: 104.75 },
      { regular: 133.00, discounted: 106.50 },
    ],
    pub_ordinary: [
      { regular: 0, discounted: 0 },
      { regular: 10.00, discounted: 8.00 },
      { regular: 10.00, discounted: 8.00 },
      { regular: 10.00, discounted: 8.00 },
      { regular: 10.00, discounted: 8.00 },
      { regular: 10.00, discounted: 8.00 },
      { regular: 11.75, discounted: 9.50 },
      { regular: 13.75, discounted: 11.00 },
      { regular: 15.50, discounted: 12.50 },
      { regular: 17.50, discounted: 14.00 },
      { regular: 19.25, discounted: 15.50 },
      { regular: 21.00, discounted: 17.00 },
      { regular: 23.00, discounted: 18.25 },
      { regular: 24.75, discounted: 19.75 },
      { regular: 26.75, discounted: 21.25 },
      { regular: 28.50, discounted: 22.75 },
      { regular: 30.25, discounted: 24.25 },
      { regular: 32.25, discounted: 25.75 },
      { regular: 34.00, discounted: 27.25 },
      { regular: 36.00, discounted: 28.75 },
      { regular: 37.75, discounted: 30.25 },
      { regular: 39.50, discounted: 31.75 },
      { regular: 41.50, discounted: 33.25 },
      { regular: 43.25, discounted: 34.75 },
      { regular: 45.25, discounted: 36.00 },
      { regular: 47.00, discounted: 37.50 },
      { regular: 48.75, discounted: 39.00 },
      { regular: 50.75, discounted: 40.50 },
      { regular: 52.50, discounted: 42.00 },
      { regular: 54.50, discounted: 43.50 },
      { regular: 56.25, discounted: 45.00 },
      { regular: 58.00, discounted: 46.50 },
      { regular: 60.00, discounted: 48.00 },
      { regular: 61.75, discounted: 49.50 },
      { regular: 63.75, discounted: 51.00 },
      { regular: 65.50, discounted: 52.50 },
      { regular: 67.25, discounted: 54.00 },
      { regular: 69.25, discounted: 55.25 },
      { regular: 71.00, discounted: 56.75 },
      { regular: 73.00, discounted: 58.25 },
      { regular: 74.75, discounted: 59.75 },
      { regular: 76.50, discounted: 61.25 },
      { regular: 78.50, discounted: 62.75 },
      { regular: 80.25, discounted: 64.25 },
      { regular: 82.25, discounted: 65.75 },
      { regular: 84.00, discounted: 67.25 },
      { regular: 85.75, discounted: 68.75 },
      { regular: 87.75, discounted: 70.25 },
      { regular: 89.50, discounted: 71.75 },
      { regular: 91.50, discounted: 73.00 },
      { regular: 93.25, discounted: 74.50 },
      { regular: 95.00, discounted: 76.00 },
      { regular: 97.00, discounted: 77.50 },
      { regular: 98.75, discounted: 79.00 },
      { regular: 100.75, discounted: 80.50 },
      { regular: 102.50, discounted: 82.00 },
      { regular: 104.25, discounted: 83.50 },
      { regular: 106.25, discounted: 85.00 },
      { regular: 108.00, discounted: 86.50 },
      { regular: 110.00, discounted: 88.00 },
      { regular: 111.75, discounted: 89.50 },
    ],
    puj: [
      { regular: 0, discounted: 0 },
      { regular: 8.00, discounted: 6.50 },
      { regular: 8.00, discounted: 6.50 },
      { regular: 8.00, discounted: 6.50 },
      { regular: 8.00, discounted: 6.50 },
      { regular: 9.50, discounted: 7.50 },
      { regular: 10.75, discounted: 8.75 },
      { regular: 12.25, discounted: 9.75 },
      { regular: 13.50, discounted: 11.00 },
      { regular: 15.00, discounted: 12.00 },
      { regular: 16.50, discounted: 13.25 },
      { regular: 17.75, discounted: 14.25 },
      { regular: 19.25, discounted: 15.50 },
      { regular: 20.50, discounted: 16.50 },
      { regular: 22.00, discounted: 17.75 },
      { regular: 23.50, discounted: 18.75 },
      { regular: 24.75, discounted: 19.75 },
      { regular: 26.25, discounted: 21.00 },
      { regular: 27.50, discounted: 22.25 },
      { regular: 29.00, discounted: 23.25 },
      { regular: 30.50, discounted: 24.50 },
      { regular: 31.75, discounted: 25.50 },
      { regular: 33.25, discounted: 26.75 },
      { regular: 34.50, discounted: 27.75 },
      { regular: 36.00, discounted: 28.75 },
      { regular: 37.50, discounted: 30.00 },
      { regular: 38.75, discounted: 31.00 },
      { regular: 40.25, discounted: 32.25 },
      { regular: 41.50, discounted: 33.25 },
      { regular: 43.00, discounted: 34.50 },
      { regular: 44.50, discounted: 35.50 },
      { regular: 45.75, discounted: 36.75 },
      { regular: 47.25, discounted: 37.75 },
      { regular: 48.50, discounted: 38.75 },
      { regular: 50.00, discounted: 40.00 },
      { regular: 51.50, discounted: 41.25 },
      { regular: 52.75, discounted: 42.25 },
      { regular: 54.25, discounted: 43.50 },
      { regular: 55.50, discounted: 44.50 },
      { regular: 57.00, discounted: 45.75 },
      { regular: 58.50, discounted: 46.75 },
      { regular: 59.75, discounted: 47.75 },
      { regular: 61.25, discounted: 49.00 },
      { regular: 62.50, discounted: 50.00 },
      { regular: 64.00, discounted: 51.25 },
      { regular: 65.50, discounted: 52.50 },
      { regular: 66.75, discounted: 53.50 },
      { regular: 68.25, discounted: 54.75 },
      { regular: 69.50, discounted: 55.75 },
      { regular: 71.00, discounted: 56.75 },
      { regular: 72.50, discounted: 58.00 },
    ]
  };

  var railFares = {
    'ROUTE_880747': { // LRT1
      standardFares: [
        { regular: 0, stored: 0 },
        { regular: 12, stored: 12 },
        { regular: 12, stored: 12 },
        { regular: 12, stored: 12 },
        { regular: 12, stored: 12 },
        { regular: 15, stored: 13 },
        { regular: 15, stored: 13 },
        { regular: 15, stored: 13 },
        { regular: 15, stored: 13 },
        { regular: 15, stored: 14 },
        { regular: 15, stored: 14 },
        { regular: 15, stored: 14 },
        { regular: 15, stored: 14 },
        { regular: 15, stored: 15 },
        { regular: 15, stored: 15 },
        { regular: 15, stored: 15 },
        { regular: 15, stored: 15 },
        { regular: 15, stored: 15 },
      ],
      specialFares: [
        { regular: 0, stored: 0 },
        { regular: 15, stored: 13 },
        { regular: 15, stored: 13 },
        { regular: 15, stored: 14 },
        { regular: 15, stored: 14 },
        { regular: 15, stored: 15 },
        { regular: 15, stored: 15 },
        { regular: 15, stored: 15 },
        { regular: 20, stored: 16 },
        { regular: 20, stored: 16 },
        { regular: 20, stored: 16 },
        { regular: 20, stored: 17 },
        { regular: 20, stored: 17 },
        { regular: 20, stored: 17 },
        { regular: 20, stored: 18 },
        { regular: 20, stored: 18 },
        { regular: 20, stored: 18 },
        { regular: 20, stored: 19 },
        { regular: 20, stored: 19 },
        { regular: 20, stored: 20 },
      ],
      stations: [
        "LTFRB_4944", // Baclaran LRT
        "LTFRB_4945", // EDSA LRT
        "LTFRB_4946", // Libertad LRT
        "LTFRB_4947", // Gil Puyat LRT
        "LTFRB_4948", // Vito Cruz LRT
        "LTFRB_4949", // Quirino Ave LRT
        "LTFRB_4950", // Pedro Gil LRT
        "LTFRB_4951", // UN Ave LRT
        "LTFRB_4952", // Central Terminal LRT
        "LTFRB_4953", // Carriedo LRT
        "LTFRB_4954", // Doroteo Jose LRT
        "LTFRB_4955", // Bambang LRT
        "LTFRB_4956", // Tayuman LRT
        "LTFRB_4957", // Blumentritt LRT
        "LTFRB_4958", // Abad Santos LRT
        "LTFRB_4959", // R. Papa LRT
        "LTFRB_4960", // 5th Ave LRT
        "LTFRB_4961", // Monumento LRT
        "LTFRB_4962", // LRT Balintawak
        "LTFRB_4963", // Roosevelt LRT
      ],
      getFare: function(from, to) {
        var fromIndex = this.stations.indexOf(from);
        var toIndex = this.stations.indexOf(to);
        if(fromIndex >= 17 || toIndex >= 17) { // use special fares
          return this.specialFares[Math.abs(fromIndex - toIndex)].regular;
        }
        else { // use standard fares
          return this.standardFares[Math.abs(fromIndex - toIndex)].regular;
        }
      }
    },

    "ROUTE_880801": { // LRT2
      fares: [
        0,
        12,
        12,
        12,
        13,
        13,
        13,
        14,
        14,
        14,
        15
      ],
      stations: [
        "LTFRB_4977", // Recto LRT
        "LTFRB_4978", // Legarda LRT
        "LTFRB_4979", // Pureza LRT
        "LTFRB_4980", // V. Mapa LRT
        "LTFRB_4981", // J. Ruiz LRT
        "LTFRB_4982", // Gilmore LRT
        "LTFRB_4983", // Betty Go Belmonte LRT
        "LTFRB_4984", // Cubao LRT
        "LTFRB_4985", // Anonas LRT
        "LTFRB_4986", // Katipunan LRT
        "LTFRB_4987", // Santolan LRT
      ],
      getFare: function(from, to) {
        var fromIndex = this.stations.indexOf(from);
        var toIndex = this.stations.indexOf(to);
        return this.fares[Math.abs(fromIndex - toIndex)];
      }
    },

    "ROUTE_880854": { // MRT3
      fares: [
        0,
        10,
        10,
        11,
        11,
        12,
        12,
        12,
        14,
        14,
        14,
        15,
        15,
      ],
      stations: [
        "STOP_880847", // North Avenue MRT
        "LTFRB_4965", // Quezon MRT
        "LTFRB_4966", // Kamuning MRT
        "LTFRB_4967", // Cubao MRT
        "LTFRB_4968", // Santolan MRT
        "LTFRB_4969", // Ortigas MRT
        "LTFRB_4970", // Shaw MRT
        "LTFRB_4971", // Boni MRT
        "LTFRB_4972", // Guadalupe MRT
        "LTFRB_4973", // Buendia MRT
        "LTFRB_4974", // Ayala MRT
        "LTFRB_4975", // Magellanes MRT
        "LTFRB_4976", // Taft Ave MRT
      ],
      getFare: function(from, to) {
        var fromIndex = this.stations.indexOf(from);
        var toIndex = this.stations.indexOf(to);
        return this.fares[Math.abs(fromIndex - toIndex)];
      }
    },
    "ROUTE_880872": { // PNR
      getFare: function(from, to) {
        return undefined;
      }
    },
  };

  return function(leg) {
    var type = leg.mode;
    if(type == 'BUS' || type == 'JEEP') {
      type = 'puj';
      if(type == 'BUS') {
        type = 'pub_aircon';
      }
      var distance = Math.ceil(leg.distance / 1000);
      fare = busFares[type][distance];
      return fare.regular;
    }
    else if(type == 'RAIL') {
      return railFares[leg.routeId].getFare(leg.from.stopId.id, leg.to.stopId.id);
    }
  };
}();
