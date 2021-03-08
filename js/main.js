/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
var map;
var minValue;
var dataStats = {};
//function to instantiate the Leaflet map
function createMap() {
  //create the map
  map = L.map("mapid", {
    center: [37, -95],
    zoom: 4,
  });

  //add OSM base tilelayer
  L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);

  //call getData function
  getData();
}

function onEachFeature(feature, layer) {
  //no property named popupContent; instead, create html string with all properties
  var popupContent = "";
  if (feature.properties) {
    //loop to add feature property names and values to html string
    for (var property in feature.properties) {
      popupContent +=
        "<p>" + property + ": " + feature.properties[property] + "</p>";
    }
    layer.bindPopup(popupContent);
  }
}

function processData(data) {
  var attributes = [];
  var properties = data.features[0].properties;
  for (var prop in properties) {
    if (prop.indexOf("POP") !== -1) {
      attributes.push(prop);
    }
  }
  console.log(attributes);
  return attributes;
}

function calculateMinValue(data) {
  var allValues = [];

  for (var state of data.features) {
    for (var year = 2010; year <= 2019; year++) {
      var attrid = "POPESTIMATE" + String(year);
      var population = state.properties[attrid];
      allValues.push(population);
    }
  }
  dataStats.min = Math.min(...allValues);
  dataStats.max = Math.max(...allValues);

  var sum = allValues.reduce(function (a, b) {
    return a + b;
  });

  dataStats.mean = sum / allValues.length;
}

function calcPropRadius(attValue) {
  //constant factor adjusts symbol sizes evenly
  var minRadius = 5;
  //Flannery Apperance Compensation formula
  var radius = 1.0083 * Math.pow(attValue / dataStats.min, 0.3715) * minRadius;

  return radius;
}

function createPropSymbols(data, attributes) {
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return pointToLayer(feature, latlng, attributes);
    },
  }).addTo(map);
}

function createLegend(map, attributes) {
  var LegendControl = L.Control.extend({
    options: {
      position: "bottomright",
    },
    onAdd: function (map) {
      var container = L.DomUtil.create("div", "legend-control-container");

      //add temporal legend div to container
      $(container).append('<div id="temporal-legend">');

      $(container).append(
        '<h4 id="temporal-legend-text">Population in Year 2010 <h4>'
      );

      //Step 1: start attribute legend svg string
      var svg = '<svg id="attribute-legend" width="160px" height="60px">';

      var circles = ["max", "mean", "min"];

      //Step 2: loop to add each circle and text to svg string
      for (var i = 0; i < circles.length; i++) {
        //Step 3: assign the r and cy attributes
        var radius = calcPropRadius(dataStats[circles[i]]);
        var cy = 59 - radius;

        //circle string
        svg +=
          '<circle class="legend-circle" id="' +
          circles[i] +
          '" r="' +
          radius +
          '"cy="' +
          cy +
          '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';

        //evenly space out labels
        var textY = i * 20 + 20;

        //text string
        svg +=
          '<text id="' +
          circles[i] +
          '-text" x="65" y="' +
          textY +
          '">' +
          Math.round(dataStats[circles[i]] * 100) / 100 +
          " " +
          "</text>";
      }

      //close svg string
      svg += "</svg>";

      //add attribute legend svg to container
      $(container).append(svg);

      return container;
    },
  });

  map.addControl(new LegendControl());
  var currValue = $(".range-slider").val();
  console.log(currValue);

  // updateLegend(map, attributes[1]);
}

function updateLegend(map, attribute) {
  $("#temporal-legend-text").text("Population in Year " + year);
}

function pointToLayer(feature, latlng, attributes) {
  var attribute = attributes[0];
  var geojsonMarkerOptions = {
    radius: 3,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
  };
  attValue = feature.properties[attribute];
  geojsonMarkerOptions.radius = calcPropRadius(attValue);
  var layer = L.circleMarker(latlng, geojsonMarkerOptions);
  var popupContent = "<p>State: " + feature.properties["NAME"] + "</p>";
  popupContent += "<p>Year: " + attribute.slice(-4) + "</p>";
  popupContent += "<p>Population: " + feature.properties[attribute] + "</p>";

  layer.bindPopup(popupContent);

  return layer;
}

function createSequenceControls(attributes) {
  var SequenceControl = L.Control.extend({
    options: {
      position: "bottomleft",
    },

    onAdd: function () {
      var container = L.DomUtil.create("div", "sequence-control-container");
      $(container).append(
        '<input class = "range-slider" type = "range" max = 9 min = 0 step = 1 value = 0>'
      );
      // $(".range-slider").attr({
      //   max: 6,
      //   min: 0,
      //   value: 0,
      //   step: 1,
      // });
      $(container).append(
        '<button class="step" id="reverse" title="Reverse"><img src="img/backward.png"></button>'
      );
      $(container).append(
        '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>'
      );

      L.DomEvent.disableClickPropagation(container);
      return container;
    },
  });

  $("#reverse").html('<img src="img/backward.png">');
  $("#forward").html('<img src="img/forward.png">');
  map.addControl(new SequenceControl());

  var year;
  $(".step").on("click", function () {
    var currValue = $(".range-slider").val();
    if ($(this).attr("id") === "forward") {
      currValue++;
      currValue = currValue > 9 ? 0 : currValue;
      year = currValue + 2010;
      console.log(year);
      $("#temporal-legend-text").text("Population in Year " + year);
    } else if ($(this).attr("id") === "reverse") {
      currValue--;
      currValue = currValue < 0 ? 9 : currValue;
      year = currValue + 2010;
      console.log(year);
      $("#temporal-legend-text").text("Population in Year " + year);
    }

    $(".range-slider").val(currValue);
    updatePropSymbols(attributes[currValue]);
  });

  $(".range-slider").on("input", function () {
    var index = $(this).val();
    console.log(index);

    year = currValue + index;
    $("#temporal-legend-text").text("Population in Year " + year);

    updatePropSymbols(attributes[index]);
  });

  // console.log(year);
}

// function createSequenceControls(attributes) {
//   $("#panel").append('<input class = "range-slider" type = "range">');
//   $(".range-slider").attr({
//     max: 9,
//     min: 0,
//     value: 0,
//     step: 1,
//   });

//   $("#panel").append('<button class="step" id="reverse">Reverse</button>');
//   $("#panel").append('<button class="step" id="forward">Forward</button>');

//   $("#reverse").html('<img src="img/backward.png">');
//   $("#forward").html('<img src="img/forward.png">');

//   $(".step").on("click", function () {
//     var currValue = $(".range-slider").val();
//     if ($(this).attr("id") === "forward") {
//       currValue++;
//       currValue = currValue > 9 ? 0 : currValue;
//     } else if ($(this).attr("id") === "reverse") {
//       currValue--;
//       currValue = currValue < 0 ? 9 : currValue;
//     }

//     $(".range-slider").val(currValue);
//     updatePropSymbols(attributes[currValue]);
//   });

//   $(".range-slider").on("input", function () {
//     var currValue = $(this).val();
//     updatePropSymbols(attributes[currValue]);
//   });
// }

function updatePropSymbols(attribute) {
  map.eachLayer(function (layer) {
    if (layer.feature && layer.feature.properties[attribute]) {
      var props = layer.feature.properties;
      var radius = calcPropRadius(props[attribute]);
      layer.setRadius(radius);

      var popupContent = "<p><b>State:</b> " + props.NAME + "</p>";
      var year = attribute.slice(-4);
      popupContent +=
        "<p><b>Population in " + year + ":</b> " + props[attribute] + "</p>";

      popup = layer.getPopup();
      popup.setContent(popupContent).update();
    }
  });
}

//function to retrieve the data and place it on the map
function getData() {
  //load the data
  $.getJSON("data/populationEst.geojson", function (response) {
    var attributes = processData(response);
    calculateMinValue(response);

    createPropSymbols(response, attributes);

    createLegend(map, attributes);
    createSequenceControls(attributes);
  });
}

$(document).ready(createMap);
