import React, { Component, createRef } from 'react'
import * as d3 from 'd3'
export default class DivergingStackedBarPlot extends Component {
  constructor(props) {
    super(props);
    this.state={
    }
    this.container=createRef();
    this.svg=createRef();
  }

  componentDidMount() {
    this.draw(this.props);
  }
  componentDidUpdate(prevProps) {
    this.draw(this.props);
  }

  draw(props) {
    var margin = props.margin || {top: 50, right: 150, bottom: 10, left: 65},
    width = this.container.current.offsetWidth - margin.left - margin.right,
    height = (props.height||560) - margin.top - margin.bottom;

    var y = d3.scaleBand()
      .rangeRound([0, height])
      .padding(0.2);

    var x = d3.scaleLinear()
      .rangeRound([0, width]);

    var color = d3.scaleOrdinal()
      .range(["#fe414d", "#ffe63b", "#b4b4b4", "#00e6c3", "#079fff"]);

    var xAxis = d3.axisTop()
      .scale(x)

    var yAxis = d3.axisLeft()
      .scale(y)
  
    this.svg.current.innerHTML='';
    var svg = d3.select(this.svg.current)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", "d3-plot")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      color.domain(["E", "D", "C", "B", "A"]);

      const data=props.data;

      data.forEach(function(d) {
        // calc percentages
        d["E"] = +d[1]*100/d.N;
        d["D"] = +d[2]*100/d.N;
        d["C"] = +d[3]*100/d.N;
        d["B"] = +d[4]*100/d.N;
        d["A"] = +d[5]*100/d.N;
        var x0 = -1*(d["C"]/2+d["D"]+d["E"]);
        var idx = 0;
        d.boxes = color.domain().map(function(name) { 
          const op=d.options[idx];
          return {name:name, op:(op?op.value:name), x0: x0, x1: x0 += +d[name], N: +d.N, n: +d[idx += 1], avg: d.avg, category: d.category}; 
        });
      });

      var min_val = d3.min(data, function(d) {
          return d.boxes["0"].x0;
        });

      var max_val = d3.max(data, function(d) {
          return d.boxes["4"].x1;
        });

      x.domain([min_val, max_val]).nice();
      y.domain(data.map(function(d) { return d.Label; }));

      svg.append("g")
        .attr("class", "x axis")
        .call(xAxis);

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

      var vakken = svg.selectAll(".label")
          .data(data)
        .enter().append("g")
          .attr("class", "bar")
          .attr("transform", function(d) { return "translate(0," + y(d.Label) + ")"; });

      var bars = vakken.selectAll("rect")
          .data(function(d) { return d.boxes; })
        .enter().append("g").attr("class", "subbar");

      bars.append("rect")
          .attr("height", y.bandwidth())
          .attr("x", function(d) { return x(d.x0); })
          .attr("width", function(d) { return x(d.x1) - x(d.x0); })
          .style("fill", function(d) { return color(d.name); })
         .append("title")
           .text(d => `${d.op}(${d.n})`);

      bars.append("text")
          .attr("x", function(d) { return x(d.x0); })
          .attr("y", y.bandwidth()/2)
          .attr("dy", "0.5em")
          .attr("dx", "0.5em")
          .style("font", "10px sans-serif")
          .style("text-anchor", "begin")
          .text(function(d) { return (d.x1-d.x0)>3?d.n:''});
          //.text(function(d) { return d.n !== 0 && (d.x1-d.x0)>3 ? d.n : "" });

      vakken.insert("rect",":first-child")
          .attr("height", y.bandwidth())
          .attr("x", "1")
          .attr("width", width)
          .attr("fill-opacity", "0.5")
          .style("fill", "#e2e2e2")
          .attr("class", function(d,index) { return index%2===0 ? "even" : "odd"; })
        .append('title')
          .text(function(d){return d.text});
      
      vakken.append("ellipse")
        .attr("ry", 15)
        .attr("rx",15)
        .attr("cx", width+15)
        .attr("cy",y.bandwidth()/2)
        .attr("fill-opacity", "0.5")
        .style("fill", "#fff")
        .style("stroke-width","4")
        .style("stroke",function(d){
          if (d.avg>=0.80) {
            return "#079FFF";
          } else if (d.avg>=0.60) {
            return "#00e6c3";
          } else if (d.avg>=0.40) {
            return "#b4b4b4";
          } else if (d.avg>=0.20) {
            return "#FFE63B";
          } 
          return "#fe414d";
        })
      .append('title')
        .text(function(d){return d.N});
      
      vakken.append("text")
          .attr("x", width+15)
          .attr("y", y.bandwidth()/2+4)
          .attr("text-anchor","middle")
          .style("font", "10px sans-serif")
          .text(function(d) { return Math.round(d.avg*100)+'%'});

      const endInfo= vakken.append('g');
        endInfo.append("text")
          .attr("x", width+35)
          .attr("y", y.bandwidth()/2)
          .attr("text-anchor","start")
          .style("font", "12px sans-serif")
          .text(function(d) { return d.category});
        endInfo.append("text")
          .attr("x", width+35)
          .attr("y", y.bandwidth()/2+4)
          .attr("text-anchor","start")
          .attr("dominant-baseline","hanging")
          .style("font", "10px sans-serif")
          .attr('fill','gray')
          .text(function(d) { return '( r: '+d.N+' )'});


      svg.append("g")
          .attr("class", "y axis")
        .append("line")
          .attr("x1", x(0))
          .attr("x2", x(0))
          .attr("y2", height);

      // var startp = svg.append("g").attr("class", "legendbox").attr("id", "mylegendbox");
      // // this is not nice, we should calculate the bounding box and use that
      // var legend_tabs = [0, 120, 200, 375, 450];
      // var legend = startp.selectAll(".legend")
      //     .data(color.domain().slice())
      //   .enter().append("g")
      //     .attr("class", "legend")
      //     .attr("transform", function(d, i) { return "translate(" + legend_tabs[i] + ",-45)"; });

      // legend.append("rect")
      //     .attr("x", 0)
      //     .attr("width", 18)
      //     .attr("height", 18)
      //     .style("fill", color);

      // legend.append("text")
      //     .attr("x", 22)
      //     .attr("y", 9)
      //     .attr("dy", ".35em")
      //     .style("text-anchor", "begin")
      //     .style("font" ,"10px sans-serif")
      //     .text(function(d) { return d; });

      d3.selectAll(".axis path")
          .style("fill", "none")
          .style("stroke", "#000")
          .style("shape-rendering", "crispEdges")

      d3.selectAll(".axis line")
          .style("fill", "none")
          .style("stroke", "#ccc")
          .style("shape-rendering", "crispEdges")

      // var movesize = width/2 - startp.node().getBBox().width/2;
      // d3.selectAll(".legendbox").attr("transform", "translate(" + movesize  + ",0)"); 
  }

  render() {
    const {data, ...otherProps} = this.props;
    return <div ref={this.container} {...otherProps}>
      <svg ref={this.svg}/>
    </div>
  }
}