import Component from 'inferno-component'
import './AIView.css'

export default class AIView extends Component {
  constructor (props) {
    super(props)
    this.state = {
      worker: null,

      // see /public/ai-worker.js for what these mean.
      is_dead: false,
      stat_hunger: 0,
      stat_fatigue: 0,
      stat_bladder: 0,
      stat_money: 0,
      tick_hunger: 0.0,
      tick_fatigue: 0.0,
      tick_bladder: 0.0,
      tick_money: 0.0
    }
  }

  componentDidMount () {
    const w = new window.Worker('ai-worker.js')
    w.onmessage = this.handleMessage.bind(this)
    this.setState({ worker: w })
  }

  componentWillUnmount () {
    this.state.w.terminate()
  }

  handleMessage ({data}) {
    // console.log('GOT SIMULATION DATA', data)

    switch (data.msg) {
      case 'state':
        this.setState(data.store)
        break
      default:
        console.warn('unknown msg', data)
    }
  }

  render () {
    const graphedMotives = ['bladder', 'fatigue', 'hunger']

    const oc = [ 'view' ]
    if (this.state.is_dead) {
      oc.push('view-dead')
    }

    return <div className={oc.join(' ')}>
      { graphedMotives.map((m) => {
        const flw = (this.state[`stat_${m}`] + 100)

        return <div className={`view-graph view-${m}`}>
          <div className='label'>{m}</div>
          <div className='graph' style={{flexGrow: 200 - flw}} />
          <div className='line' />
          <div className='empty' style={{flexGrow: flw}} />
        </div>
      }) }
      <div className='view-graph view-money'>
        <div className={(this.state.stat_money < 0 ? 'money-negative' : '') + ' label'}>
          ${Math.round(this.state.stat_money * 100)}
        </div>
      </div>

    </div>
  }
}
