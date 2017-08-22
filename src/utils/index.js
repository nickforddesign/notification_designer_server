// const fs = require('fs')
const glob = require('glob')

const getDirectories = (src, callback) => {
  glob(src + '/**/*', callback)
}

exports.getTree = () => {
  const deferred = new Deferred()
  getDirectories('data', (err, res) => {
    if (err) {
      // console.log('Error', err);
      deferred.reject(err)
    } else {
      // console.log(res);
      deferred.resolve(res)
    }
  })
  return deferred.promise
}

// deferred promises

function Deferred () {
  this.resolve = null
  this.reject = null
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve
    this.reject = reject
  })
  Object.freeze(this)
}

module.Deferred = Deferred