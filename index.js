var assign = require('object-assign')
var http = require('http-https')
var pump = require('pump')
var querystring = require('querystring')
var split2 = require('split2')
var to = require('flush-write-stream')

module.exports = function (optionsArgument) {
  var options = assign({
    protocol: 'http:',
    port: 80,
    pathname: '/_changes',
    query: {
      feed: 'continuous',
      limit: 5
    }
  }, optionsArgument)
  var head = 0
  var buffer = []
  return function (end, callback) {
    if (end === true) {
      return
    } else if (end) {
      throw end
    } else {
      if (buffer.length) {
        getUpdates(buffer, head, options, function (error) {
          if (error) {
            callback(error)
          } else {
            shiftElement()
          }
        })
      } else {
        shiftElement()
      }
    }

    function shiftElement () {
      callback(null, buffer.shift())
    }
  }
}

function getUpdates (buffer, from, options, callback) {
  http.request(assign({}, options))
  .once('response', function (response) {
    pump(
      response,
      split2(function (line) {
        try {
          return JSON.parse(line)
        } catch (error) {
          return
        }
      }),
      to.obj(function (chunk, _, done) {
        buffer.push(chunk)
      })
    )
    .once('error', function (error) {
      callback(error)
    })
    .once('finish', function () {
      callback()
    })
  })
  .once('error', function (error) {
    callback(error)
  })
}
