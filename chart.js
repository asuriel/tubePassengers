// Various accessors that specify the four dimensions of data to visualize.
function x(d) { return d.stationXposition; }
function y(d) { return d.stationYposition; }
function radius(d) { return d.passengerNumber; }
function color(d) { return d.line; }
function key(d) { return d.name; }

// Chart dimensions.
var width = 960,
    height = 500;

//Creating a d3 scale for the line colours
var tubeColourScale = function(){
    var tubeColours = ["#000099","#FFCC00","#000000","#CC3333","#0099CC"];
    var lineNames =  ["Picadilly","Circle","Northern","Central","Victoria"];
    return d3.scale.ordinal().domain(lineNames).range(tubeColours);
};

// Various scales. These domains make assumptions of data, naturally.
var xScale = d3.scale.linear().domain([0,1043]).range([0, width]), 
    yScale = d3.scale.linear().domain([0,747]).range([height, 0]),
    radiusScale = d3.scale.sqrt().domain([0, 5e4]).range([1, 30]),
    colourScale = tubeColourScale();

// Create the SVG container and set the origin.
var tubeMapSvg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height + 250)
  .append("g");   

//create a second svg container
var busyStationSvg = d3.select("#sidebar").append("svg")
  .attr("width", 150)
  .attr("height", 750)
  .append("g");

//Add the time label; the value is set on transition.
var timeLabel = tubeMapSvg.append("text")
    .attr("class", "year label")
    .attr("text-anchor", "end")
    .attr("y", height)
    .attr("x", width )
    .text(285);

//Create labels for the top # busiest stations
function createBusyStationLabels(numberOfTopStations) {

  var busyStationLabels = [];

  for(var i = 0; i < numberOfTopStations; i++) {

    busyStationLabels[i] = busyStationSvg.append("text")
      .attr("y", i*20)
      .attr("x", 0)
      .text(i+1 + "st  " + "busiest");
  }

  return busyStationLabels;
}

var numberOfStationsToDisplay = 8;

var busyStationLabels = createBusyStationLabels(numberOfStationsToDisplay);




d3.json("/data/ready_data.json", function(stations) {

     // Add a dot per station. Initialize the data at 04:45(285), and set the colors.
    var dot = tubeMapSvg.append("g")
        .attr("class", "dots")
        .selectAll(".dot")
        .data(getStationDataAt(285))
        .enter().append("circle")
        .attr("class", "dot")
        .style("fill", function(d) { return colourScale(color(d)); })
        .call(position)
        .sort(order);

    // Add a tooltip.
    dot.append("title")
       .text(function(d) { return d.name;});

  // Add an overlay for the time label to control the time.
  var box = timeLabel.node().getBBox();

  var overlay = tubeMapSvg.append("rect")
        .attr("class", "overlay")
        .attr("x", box.x)
        .attr("y", box.y)
        .attr("width", box.width )
        .attr("height", box.height)
        .on("mouseover", enableInteraction);

  // Start a transition that interpolates the data based on time.
  tubeMapSvg.transition()
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
        tubeMapSvg.transition().duration(0);

        overlay
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .on("mousemove", mousemove)
            .on("touchmove", mousemove);

        function mouseover() {
            timeLabel.classed("active", true);
        }

        function mouseout() {
            timeLabel.classed("active", false);
        }

        function mousemove() {
            updateChart(timesScale.invert(d3.mouse(this)[0]));
        }
    }

      // Tweens the entire chart by first tweening the time, and then the data.
  // For the interpolated data, the dots and label are redrawn.
    function tweenTimes() {
      var times = d3.interpolateNumber(285, 1425);
      return function(t) { updateChart(times(t));};
    }


    function updateBusiestStations(stationData) {
      var sortedData =_.sortBy(stationData,"passengerNumber").reverse();

       for (var i = 0; i < busyStationLabels.length; i++) {
         busyStationLabels[i].text(sortedData[i].name); 
       }
    }

    function updateDots(data) {
      dot.data(data, key).call(position);
    }

    function updateTimeLabel(time){
      timeLabel.text( getTime( (Math.round(time) * 60 * 1000)));
    }
    
   // Updates the display to show time of the day.
    function updateChart(time) {
      var data = getStationDataAt(time);

      updateBusiestStations(data); 
      updateDots(data);
      updateTimeLabel(time);
    }

    function getStationDataAt(time) {
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

