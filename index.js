var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

inherits(Channel, EventEmitter)

module.exports = Channel

function Channel(options) {
  if (!(this instanceof Channel))
    return new Channel(options)

  options = options || {}

  EventEmitter.call(this, options)

  this.concurrency = options.concurrency || Infinity
  this.closed = !options.close

  this.fns = []
  this.results = []

  this.fnIndex = 0
  this.resultIndex = 0
  this.pending = 0
  this.errors = 0

  this.reading = true
}

// you can push to the channel when someone is reading from it
// and the number of callbacks executing is lower than the concurrency
Object.defineProperty(Channel.prototype, 'pushable', {
  get: function () {
    return this.reading
      && this.pending < this.concurrency
  }
})

// finished callbacks / total # of callbacks
Object.defineProperty(Channel.prototype, 'progress', {
  get: function () {
    var total = this.fns.length
    // results already read
    var done = this.resultIndex
    // results not yet read
    var pending = this.results
      .slice(this.resultIndex)
      .filter(valid).length

    return (done + pending) / total
  }
})

function valid() {
  return true
}

// totally number of callbacks pushed
Object.defineProperty(Channel.prototype, 'length', {
  get: function () {
    return this.fns.length
  }
})

// # of results to be read
// they may or may not have been executed already
Object.defineProperty(Channel.prototype, 'queue', {
  get: function () {
    return this.fns.length - this.resultIndex
  }
})

// if all the results have been read,
// ended = true
Object.defineProperty(Channel.prototype, 'ended', {
  get: function () {
    return this.fns.length !== this.resultIndex
  }
})

// you can continue reading from a channel if
// there are results in the queue
// or the channel is still open.
Object.defineProperty(Channel.prototype, 'readable', {
  get: function () {
    return this.queue || !this.closed
  }
})

// call the next function
Channel.prototype.call = function () {
  // no more to call
  if (this.fnIndex === this.fns.length)
    return

  var self = this
  var index = this.fnIndex++
  var fn = this.fns[index]
  this.pending++
  fn(function (err, res) {
    self.pending--
    delete self.fns[index]

    if (err) {
      self.reading = false
      self.errors++
      self.results[index] = err
    } else {
      self.results[index] = arguments.length > 2
        ? [].slice.call(arguments, 1)
        : res
    }
    self.emit(String(index))
    self.next()
  })
}

// if we can call the next function, do so
Channel.prototype.next = function () {
  if (this.pushable)
    this.call()
}

// push a function
Channel.prototype.push = function (fn) {
  if (fn == null) {
    this.closed = true
    return this.fns.length
  }
  if (typeof fn !== 'function')
    throw new TypeError('you may only push functions')

  var length = this.fns.push(fn)
  this.results.length++
  this.next()
  return length
}

Channel.prototype.read = function* () {
  // continue executing callbacks if no errors occured
  if (!this.reading && !this.errors)
    this.reading = true
  // return nothing if the channel is closed
  // and there is no more results to read
  if (this.ended && this.closed)
    return

  // return the next pending result
  var index = this.resultIndex
  // `in` because these arrays have holes!
  if (index in this.results) {
    this.resultIndex++
    var res = this.results[index]
    delete this.results[index]
    if (res instanceof Error) {
      this.errors--
      throw res
    }
    return res
  }

  // wait for the result of `index`
  // i don't really like using emitters here but whatever
  var self = this
  return yield function (done) {
    self.once(String(index), function () {
      self.resultIndex++
      var res = self.results[index]
      delete self.results[index]
      if (res instanceof Error) {
        this.errors--
        done(res)
      } else {
        done(null, res)
      }
    })
  }
}

Channel.prototype.flush = function* () {
  var results = []
  while (this.readable) {
    console.log('reading')
    results.push(yield* this.read())
  }
  return results
}