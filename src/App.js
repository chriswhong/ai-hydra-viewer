import React, { useCallback, useMemo } from 'react';
import convert from 'xml-js';
import * as d3 from 'd3';
import { useDropzone } from 'react-dropzone';
import './App.css';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '50px',
  borderWidth: 2,
  borderRadius: 18,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out'
};

const activeStyle = {
  borderColor: '#2196f3'
};

const acceptStyle = {
  borderColor: '#00e676'
};

const rejectStyle = {
  borderColor: '#ff1744'
};

function Basic(props) {

  const onDrop = useCallback(acceptedFiles => {
    const reader = new FileReader()

    reader.onabort = () => console.log('file reading was aborted')
    reader.onerror = () => console.log('file reading has failed')
    reader.onload = () => {
      // Do whatever you want with the file contents
      const binaryStr = reader.result
      console.log('files', acceptedFiles)
      props.onFileParse(binaryStr, acceptedFiles[0].name)
    }

    acceptedFiles.forEach(file => reader.readAsBinaryString(file))
  }, [])

  const {
    acceptedFiles,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    multiple: false,
    onDrop,
  });

  const style = useMemo(() => ({
    ...baseStyle,
    ...(isDragActive ? activeStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isDragActive,
    isDragReject
  ]);

  return (
    <section className="container">
      <div {...getRootProps({className: 'dropzone', style})}>
        <input {...getInputProps()} />
        <p>Drag and drop an aip file here, or click to select one</p>
      </div>
    </section>
  );
}


class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      json: null
    }
  }

  handleParsedFile(xml, filename) {
    const json = convert.xml2js(xml, { compact: true })
    this.setState({
      json,
      filename
    })
  }

  componentDidUpdate() {
    console.log('didupdate')
    const { json } = this.state

    if (json) {
      console.log('here')
      d3.select('.chart').select('svg').remove()
      // chart based on https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89

      // TODO get the width of the container and do everything dynamically
      const margin = {top: 50, right: 50, bottom: 50, left: 50}
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
          .attr("transform", "translate(0," + height + ")")
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
              }));
      //
      // // y axis
      // svg.append("g")
      //     .attr("class", "y axis")
      //     .call(d3.axisLeft(yScale));

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
      const colors = Object.keys(json.ramp.colors);
      colors.forEach((color) => {
        const colorData = json.ramp.colors[color].point
        svg.append("path")
          .datum(colorData)
          .attr("class", `line ${color}`)
          .attr("d", line);
      })
    }
  }

  render() {
    const { json, filename } = this.state;
    return (
      <div className="App">
        <div className="header">
          <h1>AI Hydra Schedule Viewer</h1>
        </div>
        <div className="content">
        {
          json
          ? <div className="chart-container">
              <h2>{filename}</h2>
              <div className="chart"></div>
            </div>
          : <Basic onFileParse={(xml, filename) => this.handleParsedFile(xml, filename)} />
        }
        </div>
        <div className="footer">
          <p>Maintained by <a href = "https://twitter.com/chris_whong">Chris Whong</a>. Let me know if you have feature requests or find bugs, either by @-ing me on twitter, or by <a href="https://github.com/chriswhong/ai-hydra-viewer/issues">opening a github issue</a>. </p>
          <p>Check the the AI Prime/Hydra Reef Group on Facebook for some discussion about this prototype and a potential reef light settings sharing platform I'd like to build</p>
        </div>
      </div>
    );
  }
}

export default App;
