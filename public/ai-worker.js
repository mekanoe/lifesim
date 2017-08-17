/* eslint-env webworker */
importScripts('./ai-state-machine.js', './ai-ml.js')
/* global AINet, getStore */

let HZ = 1000
const STM = 20
const DEFAULT_TICK = {
  hunger: -1,
  bladder: -0.3,
  fatigue: -1,
  money: 0.0
}

let timeout = null
let aiReady = false

let actionStack = []
const actionMap = {
  hunger: 'eating',
  bladder: 'bathroom',
  money: 'working',
  fatigue: 'sleeping'
  // idle: 'idle'
}

const store = getStore({
  // if the sim is dead, skip the tick.
  // probably try to exit execution.
  is_dead: false,

  current_state: 'idle',

  // Stats go from -100 (worst state) to 100 (best state)
  // if any stat hits -100, the sim dies.
  stat_hunger: 0,
  stat_fatigue: 0,
  stat_bladder: 0,

  // money is special. it starts at 0, and goes to infinity.
  stat_money: 0,

  // this is what we calculate away from stats at the end of every tick.
  // every motive/action changes these values.
  // if this value is -1.0, the end of the tick means the stat drops by one.
  tick_hunger: 0.0,
  tick_fatigue: 0.0,
  tick_bladder: 0.0,
  tick_money: 0.0
})

const aiNet = new AINetDT()

const trainAI = async (action) => {
  aiNet.train({ input: store.$.toJS(), output: action })
}

const map = (action) => {
  return Object.values(actionMap).indexOf(action)
}

const unmap = (action) => {
  // console.log(action)
  return actionMap[Object.keys(actionMap)[action]]
}

const getActionCounts = () => {
  const c = {
    eating: 0,
    sleeping: 0,
    working: 0,
    bathroom: 0,
    idle: 0
  }

  for (let a of actionStack) {
    c[a]++
  }

  return c
}

const getActionStreak = () => {
  const f = actionStack[0]
  let c = 0

  for (let a of actionStack) {
    if (a === f) {
      c++
    } else {
      break
    }
  }

  return c
}

const getAction = () => {
  const { $ } = store

  for (let a of Object.keys(actionMap)) {
    // if (a === 'money') continue

    const v = $.get(`stat_${a}`)
    if (v < -97) {
      return actionMap[a]
    }
  }

  const requiredStreaks = {
    sleeping: 4,
    working: 4
  }

  if (actionStack[0] in requiredStreaks) {
    if (getActionStreak() < requiredStreaks[actionStack[0]]) {
      return actionStack[0]
    }
  }

  const counts = getActionCounts()
  const maxCounts = {
    eating: 20,
    sleeping: 20,
    working: 8,
    bathroom: 20,
    idle: 20
  }

  const sorted = Object.keys(DEFAULT_TICK).map(k => {
    return { motive: k, action: actionMap[k], val: $.get(`stat_${k}`) }
  })
  .filter(i => counts[i.action] < maxCounts[i.action])
  .sort((i, b) => i.val > b.val)

  if (sorted.length === 0) {
    return 'idle'
  }

  if (sorted.length > 1 && Math.abs(sorted[1].val - sorted[0].val) > 0) {
    const actions = sorted.map(v => v.action)
    return actions[Math.floor(Math.random() * actions.length)]
  }

  return sorted[0].action
}

const resetSim = () => {
  clearTimeout(timeout)
  store.reset()
  console.log(store.$.toJS())
  sendState()
  setTimeout(() => {
    tick()
  }, 5000)
}

const onTick = () => {
  // set our defaults
  let tick = {...DEFAULT_TICK}

  // decide on action here
  let action = getAction()

  trainAI(map(action))

  if (aiNet.ready) {
    if (!aiReady) {
      aiReady = true
      // resetSim()
      // return

      console.log(aiNet.dump())
    }
    try {
      let aiAction = aiNet.fetch(store.$.toJS())
      // console.log(`DUMB ACTION:`, action)
      action = unmap(aiAction)

      // console.log(`  AI ACTION:`, action)
      
      // for (let a of Object.keys(actionMap)) {
      //   // if (a === 'money') continue
    
      //   const v = store.$.get(`stat_${a}`)
      //   if (v < -94) {
      //     action = actionMap[a]
      //     console.warn("FORCING ACTION", action)
      //     break
      //   }
      // }
    } catch (e) {
      console.error(e)
    }
  }

  // set tick values
  switch (action) {
    case 'eating':
      tick = {
        ...tick,
        hunger: +2.0,
        money: -1.0,
        bladder: -1.75
      }
      break
    case 'sleeping':
      tick = {
        ...tick,
        fatigue: +2.0,
        bladder: -0.2,
        hunger: -0.2
      }
      break
    case 'working':
      tick = {
        ...tick,
        fatigue: -2.0,
        bladder: 0.0,
        hunger: -0.4,
        money: +0.5
      }
      break
    case 'bathroom':
      tick = {
        ...tick,
        bladder: +4.0,
        hunger: -0.2
      }
      break
  }

  if (action === 'eating' && store.$.get('stat_money') < 0) {
    tick.hunger = +1.35
  }

  store.set('current_state', action)
  actionStack.unshift(action)
  actionStack = actionStack.slice(0, STM)

  // set tick values
  for (let t in tick) {
    store.set(`tick_${t}`, tick[t])
  }
}

// onTickEnd is where we process the new stats.
const onTickEnd = () => {
  const $ = store.$
  const motives = Object.keys(DEFAULT_TICK)

  for (let m of motives) {
    const t = $.get(`tick_${m}`)
    const s = $.get(`stat_${m}`)

    // lower-clamp everything.
    let nv = Math.max(-100, s + t)

    // don't upper-clamp money.
    if (m !== 'money') {
      nv = Math.min(100, nv)
    }

    store.set(`stat_${m}`, nv)
    // store.set(`tick_${m}`, 0.0)

    if (nv === -100) {
      // sim has died.
      // rip in peace.
      store.set('is_dead', true)
    }
  }
}

const sendState = () => {
  postMessage({ msg: 'state', store: store.$.toJS() })
}

const tick = () => {
  onTick()
  onTickEnd()

  if (store.$.get('is_dead')) {
    sendState()
    close()
  }
  timeout = setTimeout(() => { tick() }, 1000 / HZ)
}

this.onmessage = ({action, data}) => {
  switch (action) {
    case 'ch_hz':
      HZ = data
  }
}

const randomizeState = () => {
  const motives = Object.keys(DEFAULT_TICK)

  for (let m of motives) {
    if (m === 'money') continue

    const nv = Math.round(Math.random() * 193) - 97 // -193 <-> 193

    store.set(`stat_${m}`, nv)
  }

  sendState()
}

randomizeState()
tick()

setInterval(sendState, 1000 / 10)
