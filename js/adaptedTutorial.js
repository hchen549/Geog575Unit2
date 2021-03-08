/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
//declare map variable globally so all functions have access
var map;
var minValue;
var dataStats = {};
// var attributes = [];

//step 1 create map
function createMap() {
  //create the map
  map = L.map("mapid", {
    center: [0, 0],
    zoom: 2,
  });

  //add OSM base tilelayer
  L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);
  //call getData function
  getData(map);
}

function calculateMinValue(data) {
  //create empty array to store all data values
  var allValues = [];
  //loop through each city
  for (var city of data.features) {
    //loop through each year
    for (var year = 1985; year <= 2015; year += 5) {
      //get population for current year
      var value = city.properties["Pop_" + String(year)];
      //add value to array
      allValues.push(value);
    }
  }
  //get minimum value of our array
  dataStats.min = Math.min(...allValues);
  dataStats.max = Math.max(...allValues);

  var sum = allValues.reduce(function (a, b) {
    return a + b;
  });
  dataStats.mean = sum / allValues.length;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
  //constant factor adjusts symbol sizes evenly
  var minRadius = 5;
  //Flannery Apperance Compensation formula
  var radius = 1.0083 * Math.pow(attValue / dataStats.min, 0.5715) * minRadius;

  return radius;
}

function createPopupContent(properties, attribute) {
  var popupContent = "<p><b>City: <b> " + properties.City + "</p>";
  var year = attribute.split("_")[1];
  popupContent +=
    "<p><b>Population in " +
    year +
    ":</b> " +
    properties[attribute] +
    " million</p>";

  return popupContent;
}

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data, attributes) {
  //Step 4: Determine which attribute to visualize with proportional symbols

  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return pointToLayer(feature, latlng, attributes);
    },
  }).addTo(map);
}

function pointToLayer(feature, latlng, attributes) {
  console.log(attributes);
  var attribute = attributes[0];

  //create marker options
  var geojsonMarkerOptions = {
    fillColor: "#ff7800",
    color: "#fff",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    radius: 8,
  };

  var attValue = Number(feature.properties[attribute]);

  //Step 6: Give each feature's circle marker a radius based on its attribute value
  geojsonMarkerOptions.radius = calcPropRadius(attValue);

  var layer = L.circleMarker(latlng, geojsonMarkerOptions);

  var popupContent = createPopupContent(feature.properties, attribute);

  // var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>";
  // var year = attribute.split("_")[1];
  // popupContent +=
  //   "<p><b>Population in " +
  //   year +
  //   ":</b> " +
  //   feature.properties[attribute] +
  //   " million</p>";

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
        '<input class = "range-slider" type = "range" max = 6 min = 0 step = 1>'
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

  $(".step").on("click", function () {
    // Get the current index value
    var index = $(".range-slider").val();

    // Increment or decrement depending on button clicked
    if ($(this).attr("id") === "forward") {
      index++;
      index = index > 6 ? 0 : index;
    } else if ($(this).attr("id") === "reverse") {
      index--;
      index = index < 0 ? 6 : index;
    }

    // update the value of slider
    $(".range-slider").val(index);
    updatePropSymbols(attributes[index]);
  });

  $(".range-slider").on("input", function () {
    var index = $(this).val();
    console.log(index);
    updatePropSymbols(attributes[index]);
  });
}

// function createSequenceControls(attributes) {
//   $("#panel").append('<input class = "range-slider" type = "range">');
//   $(".range-slider").attr({
//     max: 6,
//     min: 0,
//     value: 0,
//     step: 1,
//   });

//   $("#panel").append('<button class="step" id="reverse">Reverse</button>');
//   $("#panel").append('<button class="step" id="forward">Forward</button>');

//   $("#reverse").html('<img src="img/backward.png">');
//   $("#forward").html('<img src="img/forward.png">');

//   $(".step").on("click", function () {
//     // Get the current index value
//     var index = $(".range-slider").val();

//     // Increment or decrement depending on button clicked
//     if ($(this).attr("id") === "forward") {
//       index++;
//       index = index > 6 ? 0 : index;
//     } else if ($(this).attr("id") === "reverse") {
//       index--;
//       index = index < 0 ? 6 : index;
//     }

//     // update the value of slider
//     $(".range-slider").val(index);
//     updatePropSymbols(attributes[index]);
//   });

//   $(".range-slider").on("input", function () {
//     var index = $(this).val();
//     console.log(index);
//     updatePropSymbols(attributes[index]);
//   });
// }

function createLegend(attributes) {
  var LegendControl = L.Control.extend({
    options: {
      position: "bottomright",
    },

    onAdd: function (map) {
      // create the control container with a particular class name
      var container = L.DomUtil.create("div", "legend-control-container");

      //add temporal legend div to container
      $(container).append('<div id="temporal-legend">');

      //Step 1: start attribute legend svg string
      var svg = '<svg id="attribute-legend" width="160px" height="60px">';

      //array of circle names to base loop on
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
          " million" +
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
}

function updatePropSymbols(attribute) {
  map.eachLayer(function (layer) {
    if (layer.feature && layer.feature.properties[attribute]) {
      var props = layer.feature.properties;
      var radius = calcPropRadius(props[attribute]);
      layer.setRadius(radius);

      var popupContent = createPopupContent(
        layer.feature.properties,
        attribute
      );

      // var popupContent = "<p><b>City:</b> " + props.City + "</p>";
      // var year = attribute.split("_")[1];
      // popupContent +=
      //   "<p><b>Population in " +
      //   year +
      //   ":</b> " +
      //   props[attribute] +
      //   " million</p>";

      popup = layer.getPopup();
      popup.setContent(popupContent).update();
    }
  });
}

function processData(data) {
  var attributes = [];
  var properties = data.features[0].properties;

  for (var attribute in properties) {
    if (attribute.indexOf("Pop") !== -1) {
      attributes.push(attribute);
    }
  }

  return attributes;
}
//Step 2: Import GeoJSON data
function getData(map) {
  console.log("D");
  //load the data
  $.getJSON("data/MegaCities.geojson", function (response) {
    console.log("a");
    //calculate minimum data value
    var attributes = processData(response);
    console.log("b");
    calculateMinValue(response);
    //call function to create proportional symbols
    createPropSymbols(response, attributes);
    createSequenceControls(attributes);
    createLegend(attributes);
  });
}

$(document).ready(createMap);
