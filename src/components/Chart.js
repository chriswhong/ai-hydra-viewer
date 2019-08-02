import React from 'react'
import * as d3 from 'd3'

class Chart extends React.Component {
  componentDidMount () {
    const { data } = this.props

    // clean up the data so it looks like
    // [
    //   {
    //     name: 'blue',
    //     values: [
    //       {
    //         time: 0,
    //         intensity: 0
    //       },
    //       ...
    //     ]
    //   },
    //   ...
    // ]
    const colorData = Object.keys(data.ramp.colors).map((color) => {
      return {
        name: color,
        values: data.ramp.colors[color].point.map((point) => {
          return {
            intensity: parseInt(point.intensity._text),
            time: parseInt(point.time._text)
          }
        })
      }
    })

    if (data) {
      d3.select('.chart').select('svg').remove()
      // chart based on https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89

      // TODO get the width of the container and do everything dynamically
      const margin = { top: 50, right: 50, bottom: 100, left: 50 }
      const width = 960 - margin.left - margin.right
      const height = 500 - margin.top - margin.bottom

      const xMax = 1440 // x axis is # of minutes in a day
      const yMax = 1500 // assume 2000 is max y, not sure what max intensity can be
      const xTickValues = [0, 240, 480, 720, 960, 1200, 1440]
      const yTickValues = [0, 500, 1000, 1500, 2000]

      const xScale = d3.scaleLinear()
        .domain([0, xMax - 1])
        .range([0, width])

      const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height, 0])

      const line = d3.line()
        .x(function (d) { return xScale(parseInt(d.time)) })
        .y(function (d) { return yScale(parseInt(d.intensity)) })
        .curve(d3.curveMonotoneX)

      const svg = d3.select('.chart').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      // x axis
      svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (height) + ')')
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
        .attr('dy', '1.5em')

      // add vertical gridlines
      svg.append('g')
        .attr('class', 'grid')
        .attr('transform', 'translate(0,' + height + ')')
        .call(
          d3.axisBottom(xScale)
            .tickValues(xTickValues)
            .tickSize(-height)
            .tickFormat('')
        )
        .call(g => g.select('.domain').remove())

      // add horizontal gridlines
      svg.append('g')
        .attr('class', 'grid')
        .call(
          d3.axisLeft(yScale)
            .tickValues(yTickValues)
            .tickSize(-width)
            .tickFormat('')
        )
        .call(g => g.select('.domain').remove())

      // for each color in the data, render a line
      colorData.forEach((color) => {
        svg.append('path')
          .datum(color.values)
          .attr('class', `line ${color.name}`)
          .attr('d', line)
      })

      // render circles below the x-axis for each time specified in the file
      const points = colorData[0].values.map(d => d.time)
      svg.selectAll('.dot')
        .data(points)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d))
        .attr('cy', height + 20)
        .attr('r', 5)

      // mouseover effect
      // https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91

      svg.append('path') // this is the black vertical line to follow mouse
        .attr('class', 'mouse-line')
        .style('stroke', 'black')
        .style('stroke-width', '1px')
        .style('opacity', '0')

      svg.append('rect') // append a rect to catch mouse movements on canvas
        .attr('width', width) // can't catch mouse events on a g element
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function () { // on mouse out hide line, circles and text
          d3.select('.mouse-line')
            .style('opacity', '0')
          d3.selectAll('.mouse-per-line circle')
            .style('opacity', '0')
          d3.selectAll('.mouse-per-line text')
            .style('opacity', '0')
        })
        .on('mouseover', function () { // on mouse in show line, circles and text
          d3.select('.mouse-line')
            .style('opacity', '1')
          d3.selectAll('.mouse-per-line circle')
            .style('opacity', '1')
          d3.selectAll('.mouse-per-line text')
            .style('opacity', '1')
        })
        .on('mousemove', function () { // mouse moving over canvas
          var mouse = d3.mouse(this)
          d3.select('.mouse-line')
            .attr('d', function () {
              var d = 'M' + mouse[0] + ',' + height
              d += ' ' + mouse[0] + ',' + 0
              return d
            })

          var lines = document.getElementsByClassName('line')

          d3.selectAll('.mouse-per-line')
            .attr('transform', function (d, i) {
              // start with the full length of the line
              var beginning = 0
              var end = lines[i].getTotalLength()
              var target = null

              let position

              // follow the line along the x dimension
              // slice the line into smaller and smaller segments until
              // the midpoint matches the mouse's x position
              // now we know the y position
              while (true) {
                target = Math.floor((beginning + end) / 2)
                position = lines[i].getPointAtLength(target)

                // handle begginning and end
                if ((target === end || target === beginning) && position.x !== mouse[0]) {
                  break
                }

                if (position.x > mouse[0]) end = target
                else if (position.x < mouse[0]) beginning = target
                else break // position found when x = mouse[0]
              }

              d3.select(this).select('text')
                .text(yScale.invert(position.y).toFixed(2))

              return 'translate(' + mouse[0] + ',' + position.y + ')'
            })
        })

      var mousePerLine = svg.selectAll('.mouse-per-line')
        .data(colorData)
        .enter()
        .append('g')
        .attr('class', 'mouse-per-line')

      mousePerLine.append('circle')
        .attr('r', 7)
        .attr('class', d => d.name)
        .style('fill', 'none')
        .style('stroke-width', '1px')
        .style('opacity', '0')
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
