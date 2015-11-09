// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.stationXposition; }
function y(d) { return d.stationYposition; }
function radius(d) { return d.passengerNumber; }
function color(d) { return d.line; }
function key(d) { return d.name; }


//line colours
var lineColors = function(){
    var tubeColors = ["#000099","#FFCC00","#000000","#CC3333","#0099CC"];
    return d3.scale.ordinal().range(tubeColors);
};

// Chart dimensions.
var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 960 - margin.right ,
    height = 500 - margin.top - margin.bottom ;


// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.linear().domain([0,1043]).range([0, width]), 
    yScale = d3.scale.linear().domain([0,747]).range([height, 0]),
    radiusScale = d3.scale.sqrt().domain([0, 5e4]).range([0, 30]),
    colorScale = lineColors();

// The x & y axes.
var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(30, d3.format(",d")),
    yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(30, d3.format("d"));

//create a second svg container
var svg2 = d3.select("#sidebar").append("svg")
  .attr("width", 150)
  .attr("height", 750)
  .append("g")
    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");    

// Create the SVG container and set the origin.
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 250)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add the x-axis.
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .attr("visibility", "hidden")
    .call(xAxis);

// Add the y-axis.
svg.append("g")
    .attr("class", "y axis")
    .attr("visibility", "hidden")
    .call(yAxis);    

//Add the year label; the value is set on transition.
var label = svg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height)
    .attr("x", width )
    .text(285);


var numberOfStationsToDisplay = 8;

function createBusyStationLabels(numberOfTopStations) {

  var busyStationLabels = [];

  for(var i = 0; i < numberOfTopStations; i++) {

    busyStationLabels[i] = svg2.append("text")
      .attr("y", i*20)
      .attr("x", 0)
      .text(i+1 + "st  " + "busiest");
  }

  return busyStationLabels;
}

var busyStationLabels = createBusyStationLabels(numberOfStationsToDisplay);





d3.json("/data/ready_data.json", function(stations) {

     // Add a dot per station. Initialize the data at 1800, and set the colors.
    var dot = svg.append("g")
        .attr("class", "dots")
    .selectAll(".dot")
        .data(getData(285))
    .enter().append("circle")
        .attr("class", "dot")
        .style("fill", function(d) { return colorScale(color(d)); })
        .call(position)
        .sort(order);

    // Add a title.
    dot.append("title")
       .text(function(d) { return d.name; });

  // Add an overlay for the year label.
  var box = label.node().getBBox();

  var overlay = svg.append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width )
        .attr("height", box.height)
        .on("mouseover", enableInteraction);

  // Start a transition that interpolates the data based on time.
  svg.transition()
      .duration(30000)
      .ease("linear")
      .tween("times", tweenTimes)
      .each("end", enableInteraction);

       
      // Positions the dots based on data.
    function position(dot) {
      dot .attr("cx", function(d) { return xScale(x(d)); })
          .attr("cy", function(d) { return yScale(y(d)); })
          .attr("r", function(d) { return radiusScale(radius(d)); });
    }

    // Defines a sort order so that the smallest dots are drawn on top.
    function order(a, b) {
      return radius(b) - radius(a);
    }

    function enableInteraction() {
        var timesScale = d3.scale.linear()
            .domain([285,1425])
            .range([box.x + 10, box.x + box.width - 10])
            .clamp(true);

        // Cancel the current transition, if any.
        svg.transition().duration(0);

        overlay
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("mousemove", mousemove)
            .on("touchmove", mousemove);

        function mouseover() {
            label.classed("active", true);
        }

        function mouseout() {
            label.classed("active", false);
        }

        function mousemove() {
            updateChart(timesScale.invert(d3.mouse(this)[0]));
        }
    }

      // Tweens the entire chart by first tweening the year, and then the data.
  // For the interpolated data, the dots and label are redrawn.
    function tweenTimes() {
      var times = d3.interpolateNumber(285, 1425);
      return function(t) { updateChart(times(t));};
    }


    function renderBusiestStations(stationData) {

      var sortedData =_.sortBy(stationData,"passengerNumber").reverse();

       for (var i = 0; i < busyStationLabels.length; i++) {

         busyStationLabels[i].text(sortedData[i].name);
       
       };
        // busy1.text(sortedData[0].name);
        // busy2.text(sortedData[1].name);
        // busy3.text(sortedData[2].name);
    }
    
   // Updates the display to show time of the day.
    function updateChart(time) {
      var data = getData(time);

      renderBusiestStations(data); 
      dot.data(data, key).call(position);//.sort(order);
      //label.text(Math.floor(285/60) + ":" + 285%60);
      label.text( getTime( (Math.round(time) * 60 * 1000)));


    //console.log('time update:' + time);
    }

    function getData(time) {
        return stations.map(function(d) {
            return {
                name: d.name,
                line: d.line,
                stationXposition: d.station_x,
                passengerNumber: getPassengers(d.times, time),
                stationYposition: d.station_y
            };
        });
    }

    function getPassengers(values, time) {
        var index = (time - 270)/15 -1; 

        var i  = Math.floor( index );
        return values[i][1];
    }

    //refactor this so that it receives the hour in 0445 format directly
    function getTime(milliseconds){
       var date = new Date(milliseconds);
       return date.getHours() + ":" + (date.getMinutes() <= 9 ? "0" + date.getMinutes() : date.getMinutes())

    }



    

});    

