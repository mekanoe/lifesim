self.window = {}
importScripts('./libs/dt.js', './libs/convnet.js', './libs/svm.js')
/* global dt, convnetjs, svmjs */

class AINet {
  constructor () {
    this._stack = new Immutable.Stack()
    this.ready = false
    this.ignore = ['is_dead', 'tick_hunger', 'tick_fatigue', 'tick_bladder', 'tick_money']
  }

  async trainStack () {
    this.ready = true
  }

  train ({ input, output }) {
    this._stack = this._stack.push({ ...input, output })
  }

  fetch (input) {
    return 'idle'
  }
}

class AINetDT extends AINet {
  constructor () {
    super()
    this.dt = null
    setTimeout(() => {
      console.log('training')
      this.trainStack()
    }, 1000)
  }

  async trainStack () {
    let stack = this._stack.toJS()
    // this._stack = this._stack.clear()

    this.dt = new dt.DecisionTree({
      trainingSet: stack,
      categoryAttr: 'output',
      ignoredAttributes: this.ignore
    })

    this.ready = true
    // console.log(stack)
  }

  fetch (input) {
    return this.dt.predict(input)
  }
}

class AINetC45 extends AINet {
  constructor () {
    super()
    this.c45 = C45()
    // this.ignore = [...this.ignore, 'current_state']

    setTimeout(() => {
      // this.trainStack()
      this.ready = true
    }, 1000)
  }

  trainStack () {
    const stack = this._stack.toJS()

    const inputs = stack.map(v => v.input)
    const outputs = stack.map(v => v.output)

    console.log(inputs, outputs)
    
    this.svm.train(inputs, outputs, { C: 1.0 })
  }

  train ({ input, output }) {
    input = Object.keys(input)
    .filter(k => this.ignore.indexOf(k) === -1)
    .map(k => input[k])

    this._stack = this._stack.push({ input, output })
  }

  fetch (input) {
    return this.svm.predict(input)
  }
}

class AINetSVM extends AINet {
  constructor () {
    super()
    this.svm = new svmjs.SVM()
    this.ignore = [...this.ignore, 'current_state']

    setTimeout(() => {
      this.trainStack()
      this.ready = true
    }, 1000)
  }

  trainStack () {
    const stack = this._stack.toJS()

    const inputs = stack.map(v => v.input)
    const outputs = stack.map(v => v.output)

    console.log(inputs, outputs)
    
    this.svm.train(inputs, outputs, { C: 1.0 })
  }

  train ({ input, output }) {
    input = Object.keys(input)
    .filter(k => this.ignore.indexOf(k) === -1)
    .map(k => input[k])

    this._stack = this._stack.push({ input, output })
    // this.svm.train(input, [output], { C: 1 })
  }

  fetch (input) {
    return this.svm.predict(input)
  }
}