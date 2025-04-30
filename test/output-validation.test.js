'use strict'

const { test } = require('node:test')
const sget = require('simple-get').concat
const fastify = require('..')()

const opts = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          hello: {
            type: 'string'
          }
        }
      },
      '2xx': {
        type: 'object',
        properties: {
          hello: {
            type: 'number'
          }
        }
      }
    }
  }
}

test('shorthand - output string', t => {
  t.plan(1)
  try {
    fastify.get('/string', opts, function (req, reply) {
      reply.code(200).send({ hello: 'world' })
    })
    t.assert.ok(true)
  } catch (e) {
    t.assert.fail()
  }
})

test('shorthand - output number', t => {
  t.plan(1)
  try {
    fastify.get('/number', opts, function (req, reply) {
      reply.code(201).send({ hello: 55 })
    })
    t.assert.ok(true)
  } catch (e) {
    t.assert.fail()
  }
})

test('wrong object for schema - output', t => {
  t.plan(1)
  try {
    fastify.get('/wrong-object-for-schema', opts, function (req, reply) {
      // will send { }
      reply.code(201).send({ hello: 'world' })
    })
    t.assert.ok(true)
  } catch (e) {
    t.assert.fail()
  }
})

test('empty response', t => {
  t.plan(1)
  try {
    // no checks
    fastify.get('/empty', opts, function (req, reply) {
      reply.code(204).send()
    })
    t.assert.ok(true)
  } catch (e) {
    t.assert.fail()
  }
})

test('unlisted response code', t => {
  t.plan(1)
  try {
    fastify.get('/400', opts, function (req, reply) {
      reply.code(400).send({ hello: 'DOOM' })
    })
    t.assert.ok(true)
  } catch (e) {
    t.assert.fail()
  }
})

test('server response', async (t) => {
  await fastify.listen({ port: 0 })
  t.after(() => { fastify.close() })

  await t.test('shorthand - string get ok', async (t) => {
    t.plan(4)
    await new Promise((resolve, reject) => {
      sget({
        method: 'GET',
        url: 'http://localhost:' + fastify.server.address().port + '/string'
      }, (err, response, body) => {
        t.assert.ifError(err)
        t.assert.strictEqual(response.statusCode, 200)
        t.assert.strictEqual(response.headers['content-length'], '' + body.length)
        t.assert.deepStrictEqual(JSON.parse(body), { hello: 'world' })
        resolve()
      })
    })
  })

  await t.test('shorthand - number get ok', async (t) => {
    t.plan(4)
    await new Promise((resolve, reject) => {
      sget({
        method: 'GET',
        url: 'http://localhost:' + fastify.server.address().port + '/number'
      }, (err, response, body) => {
        t.assert.ifError(err)
        t.assert.strictEqual(response.statusCode, 201)
        t.assert.strictEqual(response.headers['content-length'], '' + body.length)
        t.assert.deepStrictEqual(JSON.parse(body), { hello: 55 })
        resolve()
      })
    })
  })

  await t.test('shorthand - wrong-object-for-schema', async (t) => {
    t.plan(4)
    await new Promise((resolve, reject) => {
      sget({
        method: 'GET',
        url: 'http://localhost:' + fastify.server.address().port + '/wrong-object-for-schema'
      }, (err, response, body) => {
        t.assert.ifError(err)
        t.assert.strictEqual(response.statusCode, 500)
        t.assert.strictEqual(response.headers['content-length'], '' + body.length)
        t.assert.deepStrictEqual(JSON.parse(body), {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'The value "world" cannot be converted to a number.'
        })
        resolve()
      })
    })
  })

  await t.test('shorthand - empty', async (t) => {
    t.plan(2)
    await new Promise((resolve, reject) => {
      sget({
        method: 'GET',
        url: 'http://localhost:' + fastify.server.address().port + '/empty'
      }, (err, response, body) => {
        t.assert.ifError(err)
        t.assert.strictEqual(response.statusCode, 204)
        resolve()
      })
    })
  })

  await t.test('shorthand - 400', async (t) => {
    t.plan(4)
    await new Promise((resolve, reject) => {
      sget({
        method: 'GET',
        url: 'http://localhost:' + fastify.server.address().port + '/400'
      }, (err, response, body) => {
        t.assert.ifError(err)
        t.assert.strictEqual(response.statusCode, 400)
        t.assert.strictEqual(response.headers['content-length'], '' + body.length)
        t.assert.deepStrictEqual(JSON.parse(body), { hello: 'DOOM' })
        resolve()
      })
    })
  })
})
