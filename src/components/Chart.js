import React from 'react';
import * as d3 from 'd3';

class Chart extends React.Component {
  componentDidMount() {
    const { data } = this.props

    if (data) {
      d3.select('.chart').select('svg').remove()
      // chart based on https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89

      // TODO get the width of the container and do everything dynamically
      const margin = {top: 50, right: 50, bottom: 100, left: 50}
      const width = 960 - margin.left - margin.right
      const height = 500 - margin.top - margin.bottom

      const xMax = 1440 // x axis is # of minutes in a day
      const yMax = 1500 // assume 2000 is max y, not sure what max intensity can be
      const xTickValues = [0, 240, 480, 720, 960, 1200, 1440]
      const yTickValues = [0, 500, 1000, 1500, 2000]

      const xScale = d3.scaleLinear()
        .domain([0, xMax - 1])
        .range([0, width]);


      const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, 0]);

      const line = d3.line()
        .x(function(d) { return xScale(parseInt(d.time._text)); })
        .y(function(d) { return yScale(parseInt(d.intensity._text)); })
        .curve(d3.curveMonotoneX)

      const svg = d3.select('.chart').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // x axis
      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + (height)  + ")")
          .call(
            d3.axisBottom(xScale)
              .tickValues(xTickValues)
              .tickSize(0)
              .tickFormat((d) => {
                // handle midnight
                if (d === 0 || d === 1440) return '12AM'
                // handle noon
                if (d === 720) return '12AM'
                // handle pm
                if (d > 720) return `${(d - 720) / 60}PM`
                return `${d / 60}AM`
              })
            )
            .selectAll('text')
    .attr('dy', '1.5em');



      // add vertical gridlines
      svg.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(
          d3.axisBottom(xScale)
            .tickValues(xTickValues)
            .tickSize(-height)
            .tickFormat("")
        )
        .call(g => g.select('.domain').remove())

      // add horizontal gridlines
      svg.append("g")
        .attr("class", "grid")
        .call(
          d3.axisLeft(yScale)
            .tickValues(yTickValues)
            .tickSize(-width)
            .tickFormat("")
        )
        .call(g => g.select('.domain').remove())

      // for each color in the data, render a line
      const colors = Object.keys(data.ramp.colors);
      colors.forEach((color) => {
        const colorData = data.ramp.colors[color].point
        svg.append("path")
          .datum(colorData)
          .attr("class", `line ${color}`)
          .attr("d", line);
      })

      // render circles for each time specified in the file
      const points = data.ramp.colors.blue.point.map(d => parseInt(d.time._text))
      svg.selectAll(".dot")
        .data(points)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d))
        .attr("cy", height + 20)
        .attr("r", 5)
    }
  }

  render () {
    const { filename } = this.props
    return (
      <div className="chart-container">
        <h2>{filename}</h2>
        <div className="chart"></div>
      </div>
    )
  }
}

export default Chart
