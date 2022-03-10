import * as d3 from "d3";
import $ from "jquery";

// Initialization
const worldMapURL = "https://d3js.org/world-50m.v1.json";
const meteoritesDataURL = "https://data.nasa.gov/resource/y77d-th95.geojson";
const countriesURL = "https://d3js.org/world-50m.v1.tsv";
let worldMap;
let meteoritesData;

const width = "100%";
const height = "100%";
const colors = {};
let hue = 0;
let meteorites;

const projection = d3.geoMercator().translate([780, 360]).scale(300);
const path = d3.geoPath().projection(projection);
const svg = d3
  .select("#container")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

svg
  .append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "#266D98");

const map = svg.append("g");

const zoom = d3.zoom().on("zoom", (event) => {
  map.attr("transform", event.transform);
  meteorites.attr("transform", event.transform);
});

const sizeChange = () => {
  d3.selectAll("g").attr(
    "transform",
    "scale(" + $("#container").width() / 1900 + ")"
  );
  $("svg").height($("#container").width() / 2);
};

d3.select(window).on("resize", sizeChange);

svg.call(zoom);

// Tooltip
const div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// World map with country names on hover
Promise.all([d3.tsv(countriesURL), d3.json(worldMapURL)]).then(
  ([tsvData, topoJSONdata], error) => {
    if (error) {
      console.log(error);
    } else {
      const countryName = {};
      tsvData.forEach((d) => {
        countryName[d.iso_n3] = d.name;
      });
      worldMap = topojson.feature(
        topoJSONdata,
        topoJSONdata.objects.countries
      ).features;

      map
        .selectAll("path")
        .data(worldMap)
        .enter()
        .append("path")
        .attr("fill", "#95E1D3")
        .attr("stroke", "#266D98")
        .attr("d", path)
        .append("title")
        .text((d) => countryName[d.id]);
    }
  }
);

// Meteorite data points
d3.json(meteoritesDataURL).then((data, error) => {
  if (error) {
    console.log(error);
  }
  meteoritesData = data.features;

  meteoritesData.sort((a, b) => {
    return new Date(a.properties.year) - new Date(b.properties.year);
  });
  meteoritesData.map((e) => {
    hue += 0.35;
    colors[e.properties.year] = hue;
    e.color = "hsl(" + hue + ",100%, 50%)";
  });

  meteoritesData.sort((a, b) => {
    return b.properties.mass - a.properties.mass;
  });

  meteorites = svg
    .append("g")
    .selectAll("path")
    .data(meteoritesData)
    .enter()
    .append("circle")
    .attr("cx", (d) => {
      return projection([d.properties.reclong, d.properties.reclat])[0];
    })
    .attr("cy", (d) => {
      return projection([d.properties.reclong, d.properties.reclat])[1];
    })
    .attr("r", (d) => {
      let range = 718750 / 2 / 2;

      if (d.properties.mass <= range) return 2;
      else if (d.properties.mass <= range * 2) return 10;
      else if (d.properties.mass <= range * 3) return 20;
      else if (d.properties.mass <= range * 20) return 30;
      else if (d.properties.mass <= range * 100) return 40;
      return 50;
    })
    .attr("fill-opacity", (d) => {
      let range = 718750 / 2 / 2;
      if (d.properties.mass <= range) return 1;
      return 0.5;
    })
    .attr("stroke-width", 1)
    .attr("stroke", "#EAFFD0")
    .attr("fill", (d) => {
      return d.color;
    })
    .on("mouseover", (event, d) => {
      d3.select(this).attr("d", path).style("fill", "black");

      // Show tooltip
      div.transition().duration(200).style("opacity", 0.9);
      div
        .html(
          '<span class="def">Name:</span> ' +
            d.properties.name +
            "<br>" +
            '<span class="def">Nametype:</span> ' +
            d.properties.nametype +
            "<br>" +
            '<span class="def">Fall:</span> ' +
            d.properties.fall +
            "<br>" +
            '<span class="def">Mass:</span> ' +
            d.properties.mass +
            "<br>" +
            '<span class="def">Recclass:</span> ' +
            d.properties.recclass +
            "<br>" +
            '<span class="def">Reclat:</span> ' +
            d.properties.reclat +
            "<br>" +
            '<span class="def">Year:</span> ' +
            d.properties.year.split("T")[0] +
            "<br>"
        )
        .style("left", event.pageX + 30 + "px")
        .style("top", event.pageY / 1.5 + "px");
    })
    .on("mouseout", (d) => {
      // Reset color of dot
      d3.select(this)
        .attr("d", path)
        .style("fill", (d) => {
          return d.properties.hsl;
        });

      // Fade out tooltip
      div.transition().duration(500).style("opacity", 0);
    });
});
