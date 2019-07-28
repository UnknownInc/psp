import React, { Component, createRef } from 'react'
import * as d3 from 'd3'
export default class RowCalendarPlot extends Component {
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
    const width = this.container.current.offsetWidth;
    const weekday = props.weekday || 'sunday';
    const cellSize = 17;
    let height = 119;
    height = cellSize * (weekday === "weekday" ? 7 : 9);
    //const color = d3.scaleSequential(d3.interpolatePiYG).domain([0, 1]);
    const color = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);
    const formatMonth = d3.utcFormat("%b")
    const formatDay = (d) => "SMTWTFS"[d.getUTCDay()];
    const format = d3.format(".2%");
    const formatDate = d3.utcFormat("%x");
    const countDay = weekday === "sunday" ? (d) => d.getUTCDay() : (d) => (d.getUTCDay() + 6) % 7;
    const timeWeek = weekday === "sunday" ? d3.utcSunday : d3.utcMonday;

    function pathMonth(t) {
      const n = weekday === "weekday" ? 5 : 7;
      const d = Math.max(0, Math.min(n, countDay(t)));
      const w = timeWeek.count(d3.utcYear(t), t);
      return `${d === 0 ? `M${w * cellSize},0`
          : d === n ? `M${(w + 1) * cellSize},0`
          : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`}V${n * cellSize}`;
    }
 
    const years = d3.nest()
      .key(d => d.date.getUTCFullYear())
      .entries(props.data)  
      .reverse();

    const svg = d3.select(this.svg.current)
        .attr('width', width)
        .attr('height',height * years.length)
        .style("font", "10px sans-serif")
        .style("width", "100%")
        .style("height", "auto");

    const year = svg.selectAll("g")
      .data(years)
      .join("g")
        .attr("transform", (d, i) => `translate(40,${height * i + cellSize * 1.5})`);

    year.append("text")
      .attr("x", -5)
      .attr("y", -5)
      .attr("font-weight", "bold")
      .attr("text-anchor", "end")
      .text(d => d.key);

    year.append("g")
        .attr("text-anchor", "end")
      .selectAll("text")
      .data((weekday === "weekday" ? d3.range(2, 7) : d3.range(7)).map(i => new Date(2019, 0, i)))
      .join("text")
        .attr("x", -5)
        .attr("y", d => (countDay(d) + 0.5) * cellSize)
        .attr("dy", "0.31em")
        .text(formatDay);

    year.append("g")
      .selectAll("rect")
      .data(d => d.values)
      .join("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr("x", d => timeWeek.count(d3.utcYear(d.date), d.date) * cellSize + 0.5)
        .attr("y", d => countDay(d.date) * cellSize + 0.5)
        .attr("fill", d => color(d.value))
      .append("title")
        .text(d => `${formatDate(d.date)}: ${format(d.value)}`);

    const month = year.append("g")
      .selectAll("g")
      .data(d => d3.utcMonths(d3.utcMonth(d.values[0].date), d.values[d.values.length - 1].date))
      .join("g");

    month.filter((d, i) => i).append("path")
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .attr("d", pathMonth);

    month.append("text")
      .attr("x", d => timeWeek.count(d3.utcYear(d), timeWeek.ceil(d)) * cellSize + 2)
      .attr("y", -5)
      .text(formatMonth);
  }

  render() {
    const {data, ...otherProps} = this.props;
    return <div ref={this.container} {...otherProps}>
      <svg ref={this.svg}/>
    </div>
  }
}