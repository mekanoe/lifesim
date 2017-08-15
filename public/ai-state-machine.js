/* eslint-env webworker */
importScripts('https://cdnjs.cloudflare.com/ajax/libs/immutable/3.8.1/immutable.min.js')

const { Map } = Immutable

// throw new Error(JSON.stringify(this))

const getStore = (initialData) => {
  let store = Map(initialData)

  return {
    reset () {
      store = Map(initialData)
    },

    set (key, val) {
      if (!store.has(key)) {
        console.log(key, val)
        throw new Error("cannot write to a key that doesn't exist")
      }

      store = store.set(key, val)
    },

    get $ () {
      return store.toMap()
    }
  }
}
