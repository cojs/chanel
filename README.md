# parchan [![Build Status](https://travis-ci.org/cojs/parchan.png)](https://travis-ci.org/cojs/parchan)

Order preserving array-like channel. Used to execute functions in parallel with concurrency and optional "streaming".

```js
var parchan = require('parchan')

co(function* () {
  var ch = parchan()
  // only two file descriptors open at a time
  ch.concurrency = 2

  var files = [
    '1.txt',
    '2.txt',
    '3.txt',
    '4.txt',
    '5.txt',
    '6.txt',
  ]

  // create and push the functions
  files.forEach(function (filename) {
    ch.push(function (done) {
      fs.readFile(filename, 'utf8', done)
    })
  })

  while (!ch.ended) {
    // write each file to stdout in order
    var res = yield* ch.read()
    process.stdout.write(res)
  }

  // exit the process
  process.exit()
})
```

or concatenate them all with:

```js
var results = yield* ch.flush()
var string = results.join('')
```

This is very similar to other libraries like [batch](https://github.com/visionmedia/batch) except:

- You can push functions and pull data while the callbacks are in progress
- You don't have to wait until all the callbacks are finished for you to start reading data
- Data will always be returned in the correct order

The general use-case is concatenating files (as the example above).

## API

### var ch = archan([options])

- `concurrency` <Infinity> - maximum number of concurrent callbacks

### var length = ch.push(fn)

Push a thunk. Returns the total length of the channel (total number of functions pushed).

### var result = yield* ch.read()

Pull the next value in the channel.

If an error was thrown, this function will throw that error, and no more additional callbacks will be executed. To continue executing callbacks, just `.read()` again.

Errors will be thrown in the correct order.

### var results = yield* ch.flush()

Return all the pending values in the channel.

### ch.length

Total number of functions in the channel.

### ch.progress

Fraction of functions in the channel that are done.

### ch.queue

Number of results waiting to be read.

### ch.ended

When all the results of the channel have been read.

## License

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
