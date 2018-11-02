var data = []; // the variable that holds the data from csv file
var margin = { top: 25, right: 25, bottom: 25, left: 25 },
    width = 1200 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
var ourData= [];
var myStateData = {
  State: "My State",
  vePop: 10000000,
  electoralVotes: 3,
  turnout: 68,
  highestOffice: 0,
  voterWeight: 0
};

$(document).ready(function () {
    loadData();




});


function loadData() {
    d3.csv("data/2016-election.csv", function (d) {
        data = d.slice(1);
        data.forEach(function(d){
      //    console.log(d);
          d.highestOffice = parseInt(d['Highest Office'].replace(',', '').replace(',', ''));
          d.electoralVotes = parseInt(d['Electoral Votes']);
          d.voterWeight = (d.electoralVotes/d.highestOffice);
          d.vePop = parseInt(d['Voting-Eligible Population (VEP)'].replace(',', '').replace(',', ''));
          d.turnout = parseInt(d['VEP Highest Office'].replace('%',''));
        });
    //set up variables to center our axis around population or voter weight medians
    var vePopAvg = d3.median(data, function(d) { return d.vePop; });
    var maxDiffMedianPop = d3.max(data, function (d) { return (Math.abs(d.vePop - vePopAvg));});

    var vwMed = d3.median(data, function(d) { return d.voterWeight; });
    var maxDiffMedianVW = d3.max(data, function (d) { return (Math.abs(d.voterWeight - vwMed ));});
    var myState = "California";
    console.log("vwMed: " + vwMed);
    console.log("maxDiffMedianVW: " + maxDiffMedianVW);
    console.log("Max/2: " + (maxDiffMedianVW/2));


    ourData.push(myStateData);

    d3.select("#myStateSlider")
    .property("value", this.value)
    .on("input", function() {
      changeState(+this.value, vwMed, maxDiffMedianVW);
  });

  drawBubbles(vwMed, maxDiffMedianVW);
  makeState(vwMed, maxDiffMedianVW, ourData);
    });

}

function drawBubbles(vwMed, maxDiffMedianVW) {


  //Create (x,y) positions and bubble radius
  var x = d3.scalePoint()
      .domain(data.sort(function (a, b) { return d3.descending(a.State, b.State); }).map(function(d){ return d.State; }))
      .range([margin.left, 1200 - margin.right]);

  var y = d3.scaleLinear()
      .domain([vwMed-maxDiffMedianVW, vwMed+ maxDiffMedianVW])
      .range([height + margin.bottom, margin.top]);

  var r = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) { return d.vePop; })])
      .range([3, 25]);

  // Bubble opacity
  var opacity = d3.scaleLinear()
        .domain([d3.min(data, function(d) { return d.turnout; }), d3.max(data, function(d) { return d.turnout; })])
        .range([.3, 1]);

    //Tooptips
  var tooltip = d3.select("body").append("div").attr("class", "toolTip");

  //Create svg
  var svg = d3.select("#chart1").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("id", "testing");

  //Create grouping for x and y axis
  svg.append("g")
      .attr("transform", "translate(" + 0+ "," + (height +margin.top+margin.bottom)/2 + ")")
      .call(d3.axisBottom(x).tickSize(0).tickValues([]));
  //append y axis onto grouping
  svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + 0 + ")")
    .call(d3.axisLeft(y).tickSize(0).tickValues([]));
 //append y label
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("x", 0 - height/4)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Relative Voter Weight");

  //Append bubbles onto SVG
  var dot = svg.selectAll(".dot")
      .data(data).enter().append("g").append('circle')
      .attr("cy", function(d) { return y(vwMed);})
      .attr("cx", function(d) {return x(d.State);})
			.attr('r', function(d) {return r(d.vePop);})
      .attr("id", function(d) { return d.State})
      .attr("opacity", function(d) {return opacity(d.turnout);})
      .style("fill", "gray")
      .on("click", function (d) {
        myState = d.State;
      })
      .on("mousemove", function(d) {
        d3.select(this).attr("opacity", "1");
        tooltip
          .style("left", d3.event.pageX - 100 + "px")
          .style("top", d3.event.pageY - 100 + "px")
          .style("display", "inline-block")
          .html("<b>" +(d.State) + "</b> </br> Turnout: " + (d.turnout) + "% | Voter Weight: " + (d.voterWeight/vwMed).toFixed(2) );
      })
      .on("mouseout", function(d) {
        d3.select(this).attr("opacity", "0.7");
        tooltip.style("display", "none");
      });

}

function moveBubbles() {

  var vwMed = d3.median(data, function(d) { return d.voterWeight; });
  var maxDiffMedianVW = d3.max(data, function (d) { return (Math.abs(d.voterWeight - vwMed ));});

  var x = d3.scalePoint()
      .domain(data.sort(function (a, b) { return d3.ascending(a.voterWeight, b.voterWeight); }).map(function(d){ return d.State; }))
      .range([margin.left, 1200 - margin.right]);

  var y = d3.scaleLinear()
      .domain([vwMed-maxDiffMedianVW, vwMed+ maxDiffMedianVW])
      .range([height + margin.bottom, margin.top]);

  var svg = d3.selectAll("#testing");
  svg.selectAll("circle")
      .transition()
      .duration(2500)
      .style("fill", function(d) {if(d.Winner=="Clinton"){return "blue";}else{return "red";} })
      .attr("cy", function(d) { return y(d.voterWeight);});

  svg.selectAll("circle")
      .transition()
      .delay(5000)
      .duration(2500)
      .attr("cx", function(d) {return x(d.State);});

}



// adjust the value with a slider
function update(nValue, myState) {
  // adjust the value
  var r = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) { return d.vePop; })])
      .range([3, 25]);

  var x = d3.scalePoint()
      .domain(data.sort(function (a, b) { return d3.descending(a.vePop, b.vePop); }).map(function(d){ return d.State; }))
      .range([margin.left, 1200 - margin.right]);

  var updateState = data.find(obj => obj.State == this.myState);

  var updateStatePop = updateState.vePop*(nValue/50);

  var svg = d3.selectAll("#testing");

  svg.selectAll("#" + updateState.State + "")
      .attr('r', function(d) {return r(updateStatePop);});

  svg.selectAll("circle")
      .attr('cx', function(d){ return x(d.State);})
      .transition()
      .delay(50)
      .duration(500);

}

// Creating a made up state for interactivity

function makeState(vwMed, maxDiffMedianVW, ourData){

    d3.select('#population').text("Voter Age Population: " + ourData[0].vePop.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    d3.select('#ElectoralVotes').text("Number of Electoral Votes: " + ourData[0].electoralVotes);
    d3.select('#voterTurnout').text("Voter Turnout: " + ourData[0].turnout + "%");
    d3.select('#voterWeight').text("Relative Voter Weight: " + "1.0");
    //Create (x,y) positions and bubble radius
    var x = d3.scalePoint()
        .domain(data.sort(function (a, b) { return d3.descending(a.vePop, b.vePop); }).map(function(d){ return d.State; }))
        .range([margin.left, 1200 - margin.right]);

    var y = d3.scaleLinear()
        .domain([vwMed-maxDiffMedianVW, vwMed+ maxDiffMedianVW])
        .range([height + margin.bottom, margin.top]);

    var r = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.vePop; })])
        .range([2, 25]);

        // Bubble opacity
    var opacity = d3.scaleLinear()
          .domain([d3.min(data, function(d) { return d.turnout; }), d3.max(data, function(d) { return d.turnout; })])
          .range([.3, 1]);

          //Tooptips
    var tooltip = d3.select("body").append("div").attr("class", "toolTip");

    //Create svg
    var svg = d3.select("#chart2").append("svg")
        .attr("width", width/2 + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "secondViz");

    svg.append("g")
      .attr("transform", "translate(" + width/4 + "," + 0 + ")")
      .call(d3.axisLeft(y).tickValues([]));

        //Append bubbles onto SVG
    svg.selectAll(".dot").data(ourData).enter()
        .append('circle')
        .attr("id", "myState")
        .attr("cx", width/4)
        .attr('r', function (d){return r(ourData[0].vePop);} )
        .attr("cy", function(d) {return y(vwMed);})
        .style("fill", "red");


}

function changeState(nValue, vwMed, maxDiffMedianVW) {
  // adjust the value
  d3.select('#population').text("Population: " + ourData[0].vePop.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  d3.select('#voterTurnout').text("Voter Turnout: " + ourData[0].turnout + "%");
  d3.select('#voterWeight').text("Relative Voter Weight: " + (ourData[0].voterWeight/vwMed).toFixed(2));
  var vwMed = d3.median(data, function(d) { return d.voterWeight; });

  var y = d3.scaleLinear()
      .domain([vwMed-maxDiffMedianVW, vwMed+ maxDiffMedianVW])
      .range([height + margin.bottom, margin.top]);

  var x = d3.scaleLinear()
      .domain([500000, 30000000])
      .range([width + margin.bottom, margin.top]);

  var r = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) { return d.vePop; })])
      .range([3, 25]);

  myStateData.vePop = nValue;
  var additionalEV = Math.floor(myStateData.vePop/436000 );
  var newEvCount = myStateData.electoralVotes + additionalEV;
  d3.select('#ElectoralVotes').text("Number of Electoral Votes: " + newEvCount);
  myStateData.highestOffice = (myStateData.vePop * (myStateData.turnout/100));


  myStateData.voterWeight = (newEvCount/myStateData.highestOffice);
  //console.log(myStateData.voterWeight/vwMed);


  console.log(myStateData.electoralVotes);
  var svg = d3.selectAll("#secondViz");


  svg.selectAll("#myState")
      .attr('r', function(d) {return r(myStateData.vePop);})
      .attr('cy', function(d) { return y(myStateData.voterWeight)});


    }

  function  turnoutChange() {

      changeState();
    }
