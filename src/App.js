import Component from 'inferno-component'
import './registerServiceWorker'
import './App.css'
import AIView from './AIView'

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      genesisAICount: 4,
      generations: [],
      currentGenerationAlive: []
    }
  }

  onDeath (gen, idx, data) {
    if (gen === this.state.generations.length - 1) {
      this.setState({
        currentGenerationAlive: this.state.currentGenerationAlive.splice(idx, 1)
      })
    }

    console.log('rip', gen, idx)
  }

  componentDidMount () {
    const views = []

    for (let i = 0; i < this.state.genesisAICount; i++) {
      views.push(<AIView key={`1-${i}`} onDeath={(data) => this.onDeath(0, i, data)} />)
    }

    this.setState({ generations: [ views ], currentGenerationAlive: views })
    console.log(views, views)
    // setInterval()
  }

  render () {
    const gens = this.state.generations.map((g, k) => {
      return (
        <div key={k} className='generation'>
          <h2>Gen {k}</h2>
          { g }
        </div>
      )
    })

    return (
      <main>
        {gens}
        <BottomPanel />
      </main>
    )
  }
}

class BottomPanel extends Component {
  render () {
    return (
      <div className='bp'>
        <div className='options'>&nbsp;</div>
        <div className='text'>
          <p><b>LifeSim.</b> A random AI research project.</p>
        </div>
      </div>
    )
  }
}
