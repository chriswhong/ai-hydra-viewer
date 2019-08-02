import React from 'react'
import convert from 'xml-js'

import Dropzone from './components/Dropzone'
import Chart from './components/Chart'

import './App.css'

class App extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      json: null
    }
  }

  componentDidMount () {
    // look for dev=true query param
    // load sample data
    if (new URLSearchParams(window.location.search).get('dev')) {
      fetch('data/ai-signature-saxby.aip')
        .then(d => d.text())
        .then((xml) => {
          this.handleParsedFile(xml, 'ai-signature-saxby.aip')
        })
    }
  }

  handleParsedFile (xml, filename) {
    const json = convert.xml2js(xml, { compact: true })
    this.setState({
      json,
      filename
    })
  }

  render () {
    const { json, filename } = this.state
    return (
      <div className="App">
        <div className="header">
          <h1>AI Hydra Schedule Viewer</h1>
        </div>
        <div className="content">
          {
            json
              ? <Chart filename={filename} data={json}/>
              : <Dropzone onFileParse={(xml, filename) => this.handleParsedFile(xml, filename)} />
          }
        </div>
        <div className="footer">
          <p>Maintained by <a href = "https://twitter.com/chris_whong">Chris Whong</a>. Let me know if you have feature requests or find bugs, either by @-ing me on twitter, or by <a href="https://github.com/chriswhong/ai-hydra-viewer/issues">opening a github issue</a>. </p>
          <p>Check the the AI Prime/Hydra Reef Group on Facebook for some discussion about this prototype and a potential reef light settings sharing platform I&apos;d like to build</p>
        </div>
      </div>
    )
  }
}

export default App
