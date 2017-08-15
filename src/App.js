import Component from 'inferno-component'
import './registerServiceWorker'
import './App.css'
import AIView from './AIView'

export default class App extends Component {
  render () {
    return (
      <main>
        <AIView />
        <AIView />
        <AIView />
        <AIView />
        <AIView />
        <AIView />
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
