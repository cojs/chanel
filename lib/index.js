
var co = require('co')

var Channel = require('./proto')
var proto = descriptors(require('events').EventEmitter.prototype)
descriptors(Channel.prototype, proto)

module.exports = channel

function channel(options) {
  Object.defineProperties(read, proto)
  Channel.call(read, options)
  read.pushed = read.pushed.bind(read)

  return read

  function read(done) {
    if (done === true) return co(read._flush())
    if (typeof done !== 'function') throw new TypeError('not a function')
    read._read(done)
  }
}

function descriptors(source, out) {
  out = out || Object.create(null)
  Object.getOwnPropertyNames(source).forEach(function (name) {
    out[name] = Object.getOwnPropertyDescriptor(source, name)
  })
  return out
}