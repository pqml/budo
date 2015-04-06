var test = require('tape')
var budo = require('../')
var cleanup = require('./cleanup')
var path = require('path')

test('gets connect info', function(t) {
  t.plan(7)
  t.timeoutAfter(10000)

  var app = budo('test/app.js', {
    dir: __dirname,
    port: 8000
  })
  .on('error', function(err) {
    t.fail(err)
  })
  .on('connect', function(ev) {
    t.deepEqual(ev.entries, [ 'test/app.js' ], 'entries matches')
    t.equal(ev.serve, 'bundle.js', 'mapping matches')
    t.equal(ev.uri, 'http://localhost:8000/', 'uri matches')
    t.equal(ev.host, 'localhost', 'host is not specified')
    t.equal(ev.port, 8000, 'port matches')
    t.equal(ev.dir, __dirname, 'dir matches')
    app.close()
  })
  .on('reload', function() {
    t.fail('should not have received reload event')
  })
  .on('watch', function() {
    t.fail('should not have received watch event')
  })
  .on('exit', function() {
    t.ok(true, 'closing')
  })
})

test('entry mapping', function(t) {
  t.plan(2)
  t.timeoutAfter(10000)
  
  var app = budo(['test/app:foo.js', 'test/other.js'])
  .on('connect', function(ev) {
    t.equal(ev.serve, 'foo.js', 'mapping matches')
    t.deepEqual(ev.entries, ['test/app', 'test/other.js'], 'from matches')
    app.close()
  })
})

test('--serve allows explicit bundle renaming', function(t) {
  t.plan(2)
  t.timeoutAfter(10000)
  
  var app = budo(['test/app', 'test/other.js'], { serve: 'static/foo.js' })
  .on('connect', function(ev) {
    t.equal(ev.serve, 'static/foo.js', 'mapping matches')
    t.deepEqual(ev.entries, ['test/app', 'test/other.js'], 'from matches')
    app.close()
  })
})

test('sets watch() and live() by default with live: true', function(t) {
  t.plan(3)
  t.timeoutAfter(10000)

  var app = budo('test/app.js', {
    dir: __dirname,
    port: 8000,
    live: true
  })
    .once('update', function() { 
      //bundle.js changed
      t.ok(true, 'got update event')
    })
  testLive(t, app)
})

test('allow setting live() manually', function(t) {
  t.plan(3)
  t.timeoutAfter(10000)

  var app = budo('test/app.js', {
    dir: __dirname,
    port: 8000,
    live: true
  })
    .live() //start live server
    .on('update', function() {
      t.ok(true, 'got first update')
      app.reload()
    })
  testLive(t, app)
})

function testLive(t, app) {
  app
    .once('reload', function(err) { 
      //LiveReload triggered
      t.ok(true, 'got reload event')
      app.close()
    })
    .on('error', function(err) {
      t.fail(err)
    })
    .on('exit', function() {
      t.ok(true, 'closing')
    })
}