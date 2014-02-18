
var co = require('co')
var describe = require('to-descriptor')

var Channel = require('./proto')
var proto = describe(require('events').EventEmitter.prototype)
describe(Channel.prototype, proto)

module.exports = channel

function channel(options) {
  Object.defineProperties(read, proto)
  Channel.call(read, options)
  read.pushed = read.pushed.bind(read)

  return read

  function read(done) {
    if (done === true) return co(read._flush())
    if (typeof done === 'function') return read._read(done)
    throw new TypeError('not a function')
  }
}