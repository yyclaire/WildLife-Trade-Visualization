  var geoMap = d3.geoMercator().scale(200);
  var mapPath = d3.geoPath().projection(geoMap);

  var svg = d3.select(".map")
  .append("svg")
  .attr("width",1200)
  .attr("height", 520);

  var animal = "wildanimal2017.csv";
  var Importer = [];
  var Exporter = [];
  var tooltipsT1 = [];
  d3.csv(animal, function(data) {
    for (var d = 0; d < data.length; d++) {
      Importer.push(data[d].Importer);
      Exporter.push(data[d].Exporter);
      tooltipsT1.push(
          "<p class='tool-title'>" + "Animal's Name: " + data[d].Taxon + " </p>"
        + "<p class='tool-title'>" + "Animal's Term: " + data[d].Term + " </p>"
      );
    }
    var abbrs_countries = [];
    var abbrs = [];
  });

  var importX = d3.map();
  var importY = d3.map();
  var exportX = d3.map();
  var exportY = d3.map();
  var importCountries = d3.map();
  var exportCountries = d3.map();
  d3.csv("world_countries_abbr.csv", function(data) {
    var abbrs_countries = [];
    var abbrs = [];
    for (var d = 0; d < data.length; d++) {
      abbrs_countries.push(data[d].name);
      abbrs.push(data[d].alpha2);
    }
    d3.json("world_countries.json", function(data) {
      svg.selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
      .attr("d", mapPath)
      .style("opacity", 0.8)
      .style("stroke-width", "0.8")
      .style("stroke", "white")
      .style("fill", "#85C1E9")
      .on("mouseover", function(d) {
        d3.select(this)
        .style("opacity", 1)
        .style("stroke","white")
        .style("stroke-width",3);

        tip.html("<p class='tool-title countryName'>" + d.properties.name + " </p>")
            .style("opacity", 1)
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 10) + "px");
      })
      .on("mouseout", function(d) {
        d3.select(this)
        .style("opacity", 0.8)
        .style("stroke-width", "0.8")
        .style("stroke", "white");

        tip.html("")
        .style("width", "0px")
        .style("height", "0px")
        .style("opacity", 0)
        .style("padding", "0px");
      });
      for (var i = 0; i < data.features.length; i++) {
        var idx = -1;
        for (var j = 0; j < abbrs_countries.length; j++) {
          var name1 = data.features[i].properties.name;
          var name2 = abbrs_countries[j];
          if (name1 == name2) {
            idx = j;
            break;
          }
        }
        for (var k = 0; k < Importer.length; k++) {
          if (idx != -1 && Importer[k] == abbrs[idx]) {
            if (!importCountries.has(k)) {
              importCountries.set(k, data.features[i].properties.name);
            }
            if (!importX.has(k)) {
              importX.set(k, mapPath.centroid(data.features[i])[0])
            }
            if (!importY.has(k)) {
              importY.set(k, mapPath.centroid(data.features[i])[1]);
            }
            svg.append("circle")
            .attr("r", 2)
            .attr("cx", function(){
              return mapPath.centroid(data.features[i])[0];
            })
            .attr("cy", function(){
              return mapPath.centroid(data.features[i])[1];
            })
            .style("fill", "white")
            .attr("class", "importers");
          }
        }
        for (var k = 0; k < Exporter.length; k++) {
          if (idx != -1 && Exporter[k] == abbrs[idx]) {
            if (!exportCountries.has(k)) {
              exportCountries.set(k, data.features[i].properties.name);
            }
            if (!exportX.has(k)) {
              exportX.set(k, mapPath.centroid(data.features[i])[0]);
            }
            if (!exportY.has(k)) {
              exportY.set(k, mapPath.centroid(data.features[i])[1]);
            }
            svg.append("circle")
            .attr("r", 2)
            .attr("cx", function(){
              return mapPath.centroid(data.features[i])[0];
            })
            .attr("cy", function(){
              return mapPath.centroid(data.features[i])[1];
            })
            .style("fill", "white")
            .attr("class", "exporters");
          }
        }
      }
    });
  });

  function delta(plane, path) {
     var l = path.getTotalLength();
     var plane = plane;
     return function(i) {
       return function(t) {
         var p = path.getPointAtLength(t * l);

         var t2 = Math.min(t + 0.05, 1);
         var p2 = path.getPointAtLength(t2 * l);

         var x = p2.x - p.x;
         var y = p2.y - p.y;
         var r = 90 - Math.atan2(-y, x) * 180 / Math.PI;

         var s = Math.min(Math.sin(Math.PI * t) * 0.7, 0.3);

         return "translate(" + p.x + "," + p.y + ") scale(" + s + ") rotate(" + r + ")";
       }
     }
   }

  function transition(plane, route) {
    var l = route.node().getTotalLength();
    plane.transition()
    .duration(l * 50)
    .attrTween("transform", delta(plane, route.node()))
    .remove();
  }

  var tip = d3.select("body").append("div").attr("class", "tooltips");
  var i = 0;
  setInterval(
    function() {
    if (i > exportX.size() - 1) {
      i = 0;
    }
    var idx = exportX.keys()[i];
    var route = svg.append("path")
    .datum({type: "LineString", coordinates: [
        geoMap.invert([exportX.get(idx), exportY.get(idx)]),
        geoMap.invert([importX.get(idx), importY.get(idx)])
      ]
    })
    .attr('d', mapPath)
    .style("fill", "none")
    .style("stroke-dasharray", ("3, 1"))
    .style("stroke","#F8C471")
    .style("opacity", 0.8)
    .attr("class", "route")
    .on("mouseover", function(d) {
      d3.select(this)
      .style("opacity", 1)
      .style("stroke-width",3)
      .style("stroke", "#EC7063");

      var text1 = tooltipsT1[idx];
      var text2 =
          "<p class='tool-title' style=\" color:#F8C471;\">" + "Exporter Country: " + exportCountries.get(idx) + " </p>"
        + "<p class='tool-title' style=\" color:#F8C471;\">" + "Importer Country: " + importCountries.get(idx) + " </p>";
      tip.html(text2+text1)
          .style("width", "200px")
          .style("height", "100px")
          .style("opacity", 0.8)
          .style("left", (d3.event.pageX + 30) + "px")
          .style("top", (d3.event.pageY - 30) + "px")
          .style("background", "rgba(0, 0, 0, 0.7)")
          .style("padding", "5px 10px 15px 10px");

    })
    .on("mouseout", function(d) {
      d3.select(this)
      .style("opacity", 0.8)
      .style("stroke-width",1)
      .style("stroke", "#F8C471");

      tip.html("")
      .style("width", "0px")
      .style("height", "0px")
      .style("opacity", 0).style("padding", "0px");
    });

    var plane = svg.append("path")
    .attr("class", "plane")
    .attr("fill", "#F5B041")
    .attr("d", "M25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0Z");

    transition(plane, route);
    i++;
  }, 135);


  /*---------------------------------------Bubble Chart------------------------------------------------------------*/
  
  function createBubbleChart(error, countries, continentNames) {
  var populations = countries.map(function(country) { return +country.Population; });
  var meanPopulation = d3.mean(populations),
      populationExtent = d3.extent(populations),
      populationScaleX,
      populationScaleY;

  var continents = d3.set(countries.map(function(country) { return country.ContinentCode; }));
  var continentColorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(continents.values());

  var width = 1200,
      height = 800;
  var svg_bubble,
      circles,
      circleSize = { min: 10, max: 80 };
  var circleRadiusScale = d3.scaleSqrt()
    .domain(populationExtent)
    .range([circleSize.min, circleSize.max]);

  var forces,
      forceSimulation;

  createSVG();
  toggleContinentKey(!flagFill());
  createCircles();
  createForces();
  createForceSimulation();
  addFlagDefinitions();
  addFillListener();
  addGroupingListeners();

  function createSVG() {
    svg_bubble = d3.select("#bubble-chart")
      .append("svg")
        .attr("width", width)
        .attr("height", height);
  }

  function toggleContinentKey(showContinentKey) {
    var keyElementWidth = 150,
        keyElementHeight = 30;
    var onScreenYOffset = keyElementHeight*1.5,
        offScreenYOffset = 100;

    if (d3.select(".continent-key").empty()) {
      createContinentKey();
    }
    var continentKey = d3.select(".continent-key");

    if (showContinentKey) {
      translateContinentKey("translate(0," + (height - onScreenYOffset) + ")");
    } else {
      translateContinentKey("translate(0," + (height + offScreenYOffset) + ")");
    }

    function createContinentKey() {
      var keyWidth = keyElementWidth * continents.values().length;
      var continentKeyScale = d3.scaleBand()
        .domain(continents.values())
        .range([(width - keyWidth) / 2, (width + keyWidth) / 2]);

      svg_bubble.append("g")
        .attr("class", "continent-key")
        .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
        .selectAll("g")
        .data(continents.values())
        .enter()
          .append("g")
            .attr("class", "continent-key-element");

      d3.selectAll("g.continent-key-element")
        .append("rect")
          .attr("width", keyElementWidth)
          .attr("height", keyElementHeight)
          .attr("x", function(d) { return continentKeyScale(d); })
          .attr("fill", function(d) { return continentColorScale(d); });

      d3.selectAll("g.continent-key-element")
        .append("text")
          .attr("text-anchor", "middle")
          .attr("x", function(d) { return continentKeyScale(d) + keyElementWidth/2; })
          .text(function(d) { return continentNames[d]; });

      // The text BBox has non-zero values only after rendering
      d3.selectAll("g.continent-key-element text")
          .attr("y", function(d) {
            var textHeight = this.getBBox().height;
            // The BBox.height property includes some extra height we need to remove
            var unneededTextHeight = 4;
            return ((keyElementHeight + textHeight) / 2) - unneededTextHeight;
          });
    }

    function translateContinentKey(translation) {
      continentKey
        .transition()
        .duration(500)
        .attr("transform", translation);
    }
  }

  function flagFill() {
    return isChecked("#flags");
  }

  function isChecked(elementID) {
    return d3.select(elementID).property("checked");
  }

  function createCircles() {
    var formatPopulation = d3.format(",");
    circles = svg_bubble.selectAll("circle")
      .data(countries)
      .enter()
        .append("circle")
        .attr("r", function(d) { return circleRadiusScale(d.Population); })
        .on("mouseover", function(d) {
          updateCountryInfo(d);
        })
        .on("mouseout", function(d) {
          updateCountryInfo();
        });
    updateCircles();

    function updateCountryInfo(country) {
      var info = "";
      if (country) {
        info = [country.CountryName, formatPopulation(country.Population)].join(": ");
      }
      d3.select("#country-info").html(info);
    }
  }

  function updateCircles() {
    circles
      .attr("fill", function(d) {
        return flagFill() ? "url(#" + d.CountryCode + ")" : continentColorScale(d.ContinentCode);
      });
  }

  function createForces() {
    var forceStrength = 0.05;

    forces = {
      combine:        createCombineForces(),
      countryCenters: createCountryCenterForces(),
      continent:      createContinentForces(),
      population:     createPopulationForces()
    };

    function createCombineForces() {
      return {
        x: d3.forceX(width / 2).strength(forceStrength),
        y: d3.forceY(height / 2).strength(forceStrength)
      };
    }

    function createCountryCenterForces() {
      var projectionStretchY = 0.25,
          projectionMargin = circleSize.max,
          projection = d3.geoEquirectangular()
            .scale((width / 2 - projectionMargin) / Math.PI)
            .translate([width / 2, height * (1 - projectionStretchY) / 2]);

      return {
        x: d3.forceX(function(d) {
            return projection([d.CenterLongitude, d.CenterLatitude])[0];
          }).strength(forceStrength),
        y: d3.forceY(function(d) {
            return projection([d.CenterLongitude, d.CenterLatitude])[1] * (1 + projectionStretchY);
          }).strength(forceStrength)
      };
    }

    function createContinentForces() {
      return {
        x: d3.forceX(continentForceX).strength(forceStrength),
        y: d3.forceY(continentForceY).strength(forceStrength)
      };

      function continentForceX(d) {
        if (d.ContinentCode === "EU") {
          return left(width);
        } else if (d.ContinentCode === "AF") {
          return left(width);
        } else if (d.ContinentCode === "AS") {
          return right(width);
        } else if (d.ContinentCode === "NA" || d.ContinentCode === "SA") {
          return right(width);
        }
        return center(width);
      }

      function continentForceY(d) {
        if (d.ContinentCode === "EU") {
          return top(height);
        } else if (d.ContinentCode === "AF") {
          return bottom(height);
        } else if (d.ContinentCode === "AS") {
          return top(height);
        } else if (d.ContinentCode === "NA" || d.ContinentCode === "SA") {
          return bottom(height);
        }
        return center(height);
      }

      function left(dimension) { return dimension / 4; }
      function center(dimension) { return dimension / 2; }
      function right(dimension) { return dimension / 4 * 3; }
      function top(dimension) { return dimension / 4; }
      function bottom(dimension) { return dimension / 4 * 3; }
    }

    function createPopulationForces() {
      var continentNamesDomain = continents.values().map(function(continentCode) {
        return continentNames[continentCode];
      });
      var scaledPopulationMargin = circleSize.max;

      populationScaleX = d3.scaleBand()
        .domain(continentNamesDomain)
        .range([scaledPopulationMargin, width - scaledPopulationMargin*2]);
      populationScaleY = d3.scaleLog()
        .domain(populationExtent)
        .range([height - scaledPopulationMargin, scaledPopulationMargin*2]);

      var centerCirclesInScaleBandOffset = populationScaleX.bandwidth() / 2;
      return {
        x: d3.forceX(function(d) {
            return populationScaleX(continentNames[d.ContinentCode]) + centerCirclesInScaleBandOffset;
          }).strength(forceStrength),
        y: d3.forceY(function(d) {
          return populationScaleY(d.Population);
        }).strength(forceStrength)
      };
    }

  }

  function createForceSimulation() {
    forceSimulation = d3.forceSimulation()
      .force("x", forces.combine.x)
      .force("y", forces.combine.y)
      .force("collide", d3.forceCollide(forceCollide));
    forceSimulation.nodes(countries)
      .on("tick", function() {
        circles
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
      });
  }

  function forceCollide(d) {
    return countryCenterGrouping() || populationGrouping() ? 0 : circleRadiusScale(d.Population) + 1;
  }

  function countryCenterGrouping() {
    return isChecked("#country-centers");
  }

  function populationGrouping() {
    return isChecked("#population");
  }

  function addFlagDefinitions() {
    var defs = svg_bubble.append("defs");
    defs.selectAll(".flag")
      .data(countries)
      .enter()
        .append("pattern")
        .attr("id", function(d) { return d.CountryCode; })
        .attr("class", "flag")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("patternContentUnits", "objectBoundingBox")
          .append("image")
          .attr("width", 1)
          .attr("height", 1)
          // xMidYMid: center the image in the circle
          // slice: scale the image to fill the circle
          .attr("preserveAspectRatio", "xMidYMid slice")
          .attr("xlink:href", function(d) {
            return "flags/" + d.CountryCode + ".svg";
          });
  }

  function addFillListener() {
    d3.selectAll('input[name="fill"]')
      .on("change", function() {
        toggleContinentKey(!flagFill() && !populationGrouping());
        updateCircles();
      });
  }

  function addGroupingListeners() {
    addListener("#combine",         forces.combine);
    addListener("#country-centers", forces.countryCenters);
    addListener("#continents",      forces.continent);
    addListener("#population",      forces.population);

    function addListener(selector, forces) {
      d3.select(selector).on("click", function() {
        updateForces(forces);
        toggleContinentKey(!flagFill() && !populationGrouping());
        togglePopulationAxes(populationGrouping());
      });
    }

    function updateForces(forces) {
      forceSimulation
        .force("x", forces.x)
        .force("y", forces.y)
        .force("collide", d3.forceCollide(forceCollide))
        .alphaTarget(0.5)
        .restart();
    }

    function togglePopulationAxes(showAxes) {
      var onScreenXOffset = 40,
          offScreenXOffset = -40;
      var onScreenYOffset = 40,
          offScreenYOffset = 100;

      if (d3.select(".x-axis").empty()) {
        createAxes();
      }
      var xAxis = d3.select(".x-axis"),
          yAxis = d3.select(".y-axis");

      if (showAxes) {
        translateAxis(xAxis, "translate(0," + (height - onScreenYOffset) + ")");
        translateAxis(yAxis, "translate(" + onScreenXOffset + ",0)");
      } else {
        translateAxis(xAxis, "translate(0," + (height + offScreenYOffset) + ")");
        translateAxis(yAxis, "translate(" + offScreenXOffset + ",0)");
      }

      function createAxes() {
        var numberOfTicks = 10,
            tickFormat = ".0s";

        var xAxis = d3.axisBottom(populationScaleX)
          .ticks(numberOfTicks, tickFormat);

        svg_bubble.append("g")
          .attr("class", "x-axis")
          .attr("transform", "translate(0," + (height + offScreenYOffset) + ")")
          .call(xAxis)
          .selectAll(".tick text")
            .attr("font-size", "16px");

        var yAxis = d3.axisLeft(populationScaleY)
          .ticks(numberOfTicks, tickFormat);
        svg_bubble.append("g")
          .attr("class", "y-axis")
          .attr("transform", "translate(" + offScreenXOffset + ",0)")
          .call(yAxis);
      }

      function translateAxis(axis, translation) {
        axis
          .transition()
          .duration(500)
          .attr("transform", translation);
      }
    }
  }

}
/*----------------------------------------Pie Chart------------------------------------*/
var margin = {top: 20, right: 20, bottom: 30, left: 100},
width = 600 - margin.left - margin.right,
height = 800 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleBand()
.range([0, width])
.padding(0.1);
var y = d3.scaleLinear()
.range([height, 0]);

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg1 = d3.select("#export").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", 
  "translate(" + margin.left + "," + margin.top + ")");

//Bar chart label "Export"
d3.select("#export").append("h3").text("Export").attr("align", "center");
var svg2 = d3.select("#import").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", 
  "translate(" + margin.left + "," + margin.top + ")");

//Bar chart label "Import"
d3.select("#import").append("h3").text("Import").attr("align", "center");

// get the data of export
d3.csv("countries_export.csv", function(error, data) {
  if (error) throw error;
  // format the data
  data.forEach(function(d) {
    d.amount = +d.amount;
  });
  // Scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.country; }));
  y.domain([0, d3.max(data, function(d) { return d.amount; })]);
  // append the rectangles for the bar chart
  svg1.selectAll(".bar1")
  .data(data)
  .enter().append("rect")
  .attr("class", "bar1")
  .attr("x", function(d) { return x(d.country); })
  .attr("width", x.bandwidth())
  .attr("y", function(d) { return y(d.amount); })
  .attr("height", function(d) { return height - y(d.amount); });
  
  svg1.selectAll("text").data(data).enter().append("text")
  .text(function(d) { return d.amount;})
  .attr("x", function(d) { return x(d.country) + 5; })
  .attr("y", function(d) { return y(d.amount) - 5; });

  // add the x Axis
  svg1.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));
  // add the y Axis
  svg1.append("g")
  .call(d3.axisLeft(y));
});


// get the data of export
d3.csv("countries_import.csv", function(error, data) {
  if (error) throw error;
  // format the data
  data.forEach(function(d) {
    d.amount = +d.amount;
  });
  // Scale the range of the data in the domains
  x.domain(data.map(function(d) { return d.country; }));
  y.domain([0, d3.max(data, function(d) { return d.amount; })]);
  // append the rectangles for the bar chart
  svg2.selectAll(".bar2")
  .data(data)
  .enter().append("rect")
  .attr("class", "bar2")
  .attr("x", function(d) { return x(d.country); })
  .attr("width", x.bandwidth())
  .attr("y", function(d) { return y(d.amount); })
  .attr("height", function(d) { return height - y(d.amount); });
  
  svg2.selectAll("text").data(data).enter().append("text")
  .text(function(d) { return d.amount;})
  .attr("x", function(d) { return x(d.country) + 5; })
  .attr("y", function(d) { return y(d.amount) - 5; });

  // add the x Axis
  svg2.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));
  // add the y Axis
  svg2.append("g")
  .call(d3.axisLeft(y));
});
/*---------------------------------------------Pie Chart-------------------------------------------------*/
var margin = {top: 30, right: 40, bottom: 30, left: 40},
            width = 800 - margin.left - margin.right,
            height = 800 - margin.top - margin.bottom;
      
      var svgWidth = 800;
      var svgHeight = 800;
      
      var svg_pie = d3.select(".pieChart").append("svg")
          .attr("id","allpos")
          .attr("width", svgWidth)
          .attr("height", svgHeight)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
      <!-- var dataset = [ -->
        <!-- ['Actinopteri',4921286.36], -->
        <!-- ['Amphibia',15875.89], -->
        <!-- ['Anthozoa',945175.7572], -->
        <!-- ['Aves',423.678], -->
        <!-- ['Bivalvia',3679.607], -->
        <!-- ['Elasmobranchii',28953.376], -->
        <!-- ['Gastropoda',2557784.96], -->
        <!-- ['Hirudinoidea',367.95], -->
        <!-- ['Holothuroidea',2431.68], -->
        <!-- ['Hydrozoa',6], -->
        <!-- ['Mammalia',338338.5204], -->
        <!-- ['Reptilia',86581.729] -->
      <!-- ]; -->
      
      <!-- var dataset = [ -->
        <!-- ['Actinopteri',4921286.36], -->
        <!-- ['Amphibia',15875.89], -->
        <!-- ['Anthozoa',945175.7572], -->
        <!-- ['Elasmobranchii',28953.376], -->
        <!-- ['Gastropoda',2557784.96], -->
        <!-- ['Mammalia',338338.5204], -->
        <!-- ['Reptilia',86581.729], -->
        <!-- ['Other', 6908.915] -->
      <!-- ]; -->
      
      var dataset = [
        ['Actinopteri',4921286.36],
        ['Anthozoa',945175.7572],
        ['Elasmobranchii',28953.376],
        ['Gastropoda',2557784.96],
        ['Mammalia',338338.5204],
        ['Reptilia',86581.729],
        ['Other', 22784.805]
      ];
      
      var imgurl = [
        'https://upload.wikimedia.org/wikipedia/commons/8/83/Whiteperchnctc.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/5/56/White_shark.jpg',
        ' https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Coral_Outcrop_Flynn_Reef.jpg/1280px-Coral_Outcrop_Flynn_Reef.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/6/64/Grapevinesnail_01a.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Mammal_Diversity_2011.png/300px-Mammal_Diversity_2011.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Extant_reptilia.jpg/1280px-Extant_reptilia.jpg'
        
        
      ];
      
      var pie = d3.pie()
            //.sort(null)
            .value(function(d){
              return d[1]
            });
            
      var piedata = pie(dataset);
      console.log(piedata);
      
      var outerRadius = width / 4;
      var innerRadius = 0;
      var arc = d3.arc()
        .outerRadius(outerRadius)
        .innerRadius(innerRadius);
        
      var arcs = svg_pie.selectAll('g')
              .data(piedata)
              .enter()
              .append('g')
              .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
      var colors = d3.schemeCategory10;
      arcs.append('path')
        .attr('fill', function(d, i){
        return colors[i];
        })
        .attr('d', function(d){
        return arc(d);
        });
        
      arcs.append('text')
          .attr('transform', function(d, i){
            var x = arc.centroid(d)[0] * 2.8;
            var y = arc.centroid(d)[1] * 2.8;
            if(i == 5) {
              return 'translate(' + (x * 1.2) + ', ' + (y * 1.2) + ')';
            } 
            else if(i == 2) {
              return 'translate(' + (x * 1.3) + ', ' + (y * 1.3) + ')';
            } 
            else if(i == 6) {
              return 'translate(' + (x * 1.4) + ', ' + (y * 1.4) + ')';
            }
            return 'translate(' + x + ', ' + y + ')';
          })
          .attr('text-anchor', 'middle')
          .text(function(d){
            var percent = Number(d.value) / d3.sum(dataset, function(d){
              return d[1];
            }) * 100;
            return d.data[0] + ' ' + percent.toFixed(1) + '%';
          })
      
      arcs.append('line')
          .attr('stroke', 'black')
          .attr('x1', function(d){ return arc.centroid(d)[0] * 2; })
          .attr('y1', function(d){ return arc.centroid(d)[1] * 2; })
          .attr('x2', function(d, i){
            if(i == 5) {
              return arc.centroid(d)[0] * 3.2;
            }
            if(i == 2) {
              return arc.centroid(d)[0] * 3.5;
            }
            if(i == 6) {
              return arc.centroid(d)[0] * 3.8;
            }
            return arc.centroid(d)[0] * 2.5;
          })
          .attr('y2', function(d, i){
            if(i == 5) {
              return arc.centroid(d)[1] * 3.2;
            }
            if(i == 2) {
              return arc.centroid(d)[1] * 3.5;
            }
            if(i == 6) {
              return arc.centroid(d)[1] * 3.8;
            }
            return arc.centroid(d)[1] * 2.5;
          });
      
      var tooltip_pie = d3.select("#pie_tooltip")
                .append("div")
                .attr("class", "pie_tooltip")
                .style("opacity", 0);
        
      svg_pie.selectAll("path")
        .attr("opacity", 1)
        .on("mousemove", function(d, i) {
          var mouseX = d3.mouse(this)[0];
          //var invertedX = xScale.invert(mouseX);
          var mouseY = d3.mouse(this)[1];
          //var invertedY = yScale.invert(mouseY);
          
          tooltip_pie.html(
              "<h1>Class<br></h1> <p>" + dataset[i][0] + "</p>"+
              "<br><h1>Total traded quantity <br></h1> <p>" + (Math.floor(dataset[i][1]*10)/10) + "kg" + "</p>"+
              "<br><img  class='animal_image' id = '" + dataset[i][0] + "' src=' " + imgurl[i] + "' 'alt='" + dataset[i][0] + "' /></br>" + 
              "<br><p id="+dataset[i][0]+"><p>" 
              )  
            .style("left", 0 + "px")
            .style("top", 0 + "px")
            .style("position", "absolute")
            .style("opacity", .9)
            .style("width", 100)
            .style("height", "auto")  
            .style("background-color", "white")
          
          d3.selectAll("#Actinopteri")
            .html("Actinopteri or the ray-finned fishes, constitute a class or subclass of the bony fishes. Actinoperi are traded in the greatest quantities. Actinoperi are exchanged as food, for aquariums, and for traditional Chinese medicine. Because caviar is considered a delicacy in much of Europe and North America, egg-bearing sturgeons dominate the fish trade. The high value of small volumes of caviar makes it especially vulnerable to illegal, unreported trade.");
          d3.selectAll("#Gastropoda")
            .html("The Gastropoda or gastropods, more commonly known as snails and slugs, are a large taxonomic class within the phylum Mollusca. Demand for snails grew in the 1960s, when the meat of various species became a delicacy in East Asian markets. The meat is often traded in live, frozen, canned, or dried forms. Certain snails are also used as an aphrodisiac, and snail shells are made into ashtrays, soap holders, and platters.");
          d3.selectAll("#Anthozoa")
            .html("Anthozoa is a class of marine invertebrates which includes the sea anemones, stony corals, soft corals and gorgonians. Although the greatest threat to coral reef habitats is global climate change, live coral harvesting for aquariums is also hugely detrimental to their well-being. Other major threats include coral disease, fisheries, human development, invasive species, changes in native species dynamics, and pollution.");
          d3.selectAll("#Mammalia")
            .html("Mammals are traded for a greater range of purposes than other animals. Different industries and cultures find a myriad of uses for their hair, skin, tails, teeth, skeletons, meat, feet, ears, and entire bodies. From making up the fibers on your sweater to NASA flight-testing, mammal trade touches the average person’s daily life in many unexpected ways.");
          d3.selectAll("#Reptilia")
            .html("Reptiles are traded often at higher monetary values than other animals. Processed and finished reptile skins used for items like watchbands, luggage, furniture, or shoes can sell at more than 60 times the price of the raw skin, generating billions of dollars for the international commercial and fashion industries.");
          d3.selectAll("#Elasmobranchii")
            .html("Elasmobranchii is a subclass of Chondrichthyes or cartilaginous fish, including the sharks and the rays, skates, and sawfish. Shark “finning,” whereby a shark’s fins are removed and the live body is discarded back to the sea, accounts for almost 40 percent of the trade in sharks. Unable to swim, the shark sinks to the ocean floor, where it is eaten alive by other fish. As most originate from Japan before entering the global market, sharks are often used for shark fin soup or traditional Chinese medicine, and their fins have become a multibillion-dollar industry.");
      
          svg_pie.selectAll("path")
            .attr("opacity", function(d, j) {
              if(j != i) {
                return 0.5;
              }
              else {
                return 1;
              }
            });       
        })      
        .on("mouseout", function(d) {
          svg.selectAll("path")
            .attr("opacity", 1);
          tooltip_pie.style("opacity", 0);
        })      
        
/*----------------------------------------Stacked Bar Chart------------------------------------*/
var svg_normal = d3.select("#normal"),
    // svg_log = d3.select("#log"),
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = +svg_normal.attr("width") - margin.left - margin.right,
    height = +svg_normal.attr("height") - margin.top - margin.bottom,
    g = svg_normal.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    //svg_normal
    var x1 = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.05)
    .align(0.1);

    var y = d3.scaleLinear()
    .rangeRound([height, 0]);

    var z = d3.scaleOrdinal()
    .range(["#ff8c00", "green", "#fe8ffa", "gray",  "#4cd4b1", "#a05d56", "#d0743c"]);

    d3.csv("purpose.csv", function(d, i, columns) {
      for (i = 1, t = 0; i < columns.length; ++i) t += d[columns[i]] = +d[columns[i]];
        d.total = t;
      return d;
    }, function(error, data) {
      if (error) throw error;

      var keys = data.columns.slice(1);

      data.sort(function(a, b) { return b.total - a.total; });
      x1.domain(data.map(function(d) { return d.Class; }));
      y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
      z.domain(keys);

      g.append("g")
      .selectAll("g")
      .data(d3.stack().keys(keys)(data))
      .enter().append("g")
      .attr("fill", function(d) { return z(d.key); })
      .selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("x", function(d) { return x1(d.data.Class); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x1.bandwidth());

      g.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x1));

      g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(null, "s"))
      .append("text")
      .attr("x", 2)
      .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text("kg");

      var legend = g.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "end")
      .selectAll("g")
      .data(keys.slice().reverse())
      .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      legend.append("rect")
      .attr("x", width - 19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", z);

      legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9.5)
      .attr("dy", "0.32em")
      .text(function(d) { return d; });
    });
