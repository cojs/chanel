var co = require('co')

var parchan = require('./')

describe('Parallel Channel', function () {
  describe('when returning the output', function () {
    it('should work', co(function* () {
      var ch = parchan()
      var vals = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

      vals.forEach(function (i) {
        ch.push(get(i))
      })

      var results = yield* ch.flush()
      results.should.eql(vals)
    }))

    it('should work with errors', co(function* () {
      var ch = parchan()
      ch.push(get(0))
      ch.push(get(1))
      ch.push(get(2))
      ch.push(error())

      0..should.equal(yield* ch.read())
      1..should.equal(yield* ch.read())
      2..should.equal(yield* ch.read())

      try {
        yield* ch.read()
        throw new Error('WTF')
      } catch (err) {
        err.message.should.equal('boom')
      }
    }))

    it('should work with concurrency', co(function* () {
      var ch = parchan()
      ch.concurrency = 2

      var vals = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      var pending = 0

      vals.forEach(function (i) {
        ch.push(function (done) {
          pending++
          setTimeout(function () {
            pending--
            pending.should.be.below(3)
            done(null, i)
          }, Math.random() * 10)
        })
      })

      var results = yield* ch.flush()
      results.should.eql(vals)
    }))

    it('should stop executing callbacks when an error occurs', co(function* () {
      var ch = parchan()
      ch.concurrency = 1

      ch.push(get(0))
      ch.push(get(1))
      ch.push(get(2))
      ch.push(error())
      ch.push(get(4))
      ch.push(get(5))

      try {
        yield* ch.flush()
        throw new Error('wtf')
      } catch (err) {
        err.message.should.equal('boom')
      }

      yield function (done) {
        setTimeout(done, 10)
      }

      ;(4 in ch.results).should.not.be.ok
      ;(5 in ch.results).should.not.be.ok
    }))

    it('should continue executing callbacks when reading after an error', co(function* () {
      var ch = parchan()
      ch.concurrency = 1

      ch.push(get(0))
      ch.push(get(1))
      ch.push(get(2))
      ch.push(error())
      ch.push(get(4))
      ch.push(get(5))

      try {
        yield* ch.flush()
        throw new Error('wtf')
      } catch (err) {
        err.message.should.equal('boom')
      }

      4..should.equal(yield* ch.read())
      5..should.equal(yield* ch.read())
    }))
  })

  describe('when not returning the output', function () {
    it('should work', co(function* () {
      var ch = parchan({
        discard: true
      })
      var vals = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

      vals.forEach(function (i) {
        ch.push(get(i))
      })

      yield* ch.flush()
    }))

    it('should work with errors', co(function* () {
      var ch = parchan()
      ch.discard = true
      ch.push(get(0))
      ch.push(get(1))
      ch.push(get(2))
      ch.push(error())

      try {
        yield* ch.flush()
        throw new Error('WTF')
      } catch (err) {
        err.message.should.equal('boom')
      }
    }))

    it('should work with concurrency', co(function* () {
      var ch = parchan()
      ch.concurrency = 2
      ch.discard = true

      var vals = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      var pending = 0

      vals.forEach(function (i) {
        ch.push(function (done) {
          pending++
          setTimeout(function () {
            pending--
            pending.should.be.below(3)
            done(null, i)
          }, Math.random() * 10)
        })
      })

      yield* ch.flush()
    }))
  })

  describe('when the channel is opened', function () {
    it('should wait indefinitely for the next result', function (done) {
      var ch = parchan()
      ch.concurrency = 1
      ch.open()

      co(function* () {
        yield function (done) {
          setTimeout(done, 10)
        }
        ch.push(get(0))
        ch.push(get(1))
        ch.push(get(2))
        ch.close()
      })()

      co(function* () {
        var res = yield* ch.flush()
        res.should.eql([0, 1, 2])
      })(done)
    })
  })
})

function get(x) {
  return function (done) {
    setTimeout(function () {
      done(null, x)
    }, Math.random() * 10)
  }
}

function error(msg) {
  return function (done) {
    setTimeout(function () {
      done(new Error(msg || 'boom'))
    }, Math.random() * 10)
  }
}