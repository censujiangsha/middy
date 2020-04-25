const { invoke } = require('../../test-helpers')
const middy = require('../../core')
const httpSecurityHeaders = require('../')

const createDefaultObjectResponse = () =>
  Object.assign(
    {},
    {
      statusCode: 200,
      body: { firstname: 'john', lastname: 'doe' }
    }
  )

const createHtmlObjectResponse = () =>
  Object.assign(
    {},
    {
      statusCode: 200,
      body: '<html></html>',
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }

    }
  )

const createHeaderObjectResponse = () =>
  Object.assign(
    {},
    {
      statusCode: 200,
      body: { firstname: 'john', lastname: 'doe' },
      headers: {
        Server: 'AMZN',
        'X-Powered-By': 'MiddyJS'
      }
    }
  )

describe('🔒 Middleware Http Security Headers', () => {
  test('It should return default security headers', async () => {
    const handler = middy((event, context, cb) =>
      cb(null, createDefaultObjectResponse())
    )

    handler.use(httpSecurityHeaders())

    const event = {
      httpMethod: 'GET'
    }

    const response = await invoke(handler, event)

    expect(response.statusCode).toEqual(200)
    expect(response.headers['X-DNS-Prefetch-Control']).toEqual('off')
    expect(response.headers['X-Powered-By']).toEqual(undefined)
    expect(response.headers['Strict-Transport-Security']).toEqual('max-age=15552000; includeSubDomains; preload')
    expect(response.headers['X-Download-Options']).toEqual('noopen')
    expect(response.headers['X-Content-Type-Options']).toEqual('nosniff')
    expect(response.headers['Referrer-Policy']).toEqual('no-referrer')
    expect(response.headers['X-Permitted-Cross-Domain-Policies']).toEqual('none')

    expect(response.headers['X-Frame-Options']).toEqual(undefined)
    expect(response.headers['X-XSS-Protection']).toEqual(undefined)
  })

  test('It should return default security headers when HTML', async () => {
    const handler = middy((event, context, cb) =>
      cb(null, createHtmlObjectResponse())
    )

    handler.use(httpSecurityHeaders())

    const event = {
      httpMethod: 'GET'
    }

    const response = await invoke(handler, event)

    expect(response.headers['X-DNS-Prefetch-Control']).toEqual('off')
    expect(response.headers['X-Powered-By']).toEqual(undefined)
    expect(response.headers['Strict-Transport-Security']).toEqual('max-age=15552000; includeSubDomains; preload')
    expect(response.headers['X-Download-Options']).toEqual('noopen')
    expect(response.headers['X-Content-Type-Options']).toEqual('nosniff')
    expect(response.headers['Referrer-Policy']).toEqual('no-referrer')
    expect(response.headers['X-Permitted-Cross-Domain-Policies']).toEqual('none')

    expect(response.headers['X-Frame-Options']).toEqual('DENY')
    expect(response.headers['X-XSS-Protection']).toEqual('1; mode=block')
  })

  test('It should modify default security headers', async () => {
    const handler = middy((event, context, cb) =>
      cb(null, createHeaderObjectResponse())
    )

    handler.use(httpSecurityHeaders())

    const event = {
      httpMethod: 'GET'
    }

    const response = await invoke(handler, event)

    expect(response.statusCode).toEqual(200)
    expect(response.headers.Server).toEqual(undefined)
    expect(response.headers['X-Powered-By']).toEqual(undefined)
  })

  test('It should modify default security headers', async () => {
    const handler = middy((event, context, cb) =>
      cb(null, createHtmlObjectResponse())
    )

    handler.use(httpSecurityHeaders({
      dnsPrefetchControl: {
        allow: true
      },
      hsts: {
        includeSubDomains: false,
        preload: false
      },
      hidePoweredBy: {
        setTo: 'Other'
      },
      permittedCrossDomainPolicies: {
        policy: 'all'
      },
      xssFilter: {
        reportUri: 'https://example.com/report'
      }
    }))

    const event = {
      httpMethod: 'GET'
    }

    const response = await invoke(handler, event)

    expect(response.statusCode).toEqual(200)
    expect(response.headers['X-Permitted-Cross-Domain-Policies']).toEqual('all')
    expect(response.headers['X-DNS-Prefetch-Control']).toEqual('on')
    expect(response.headers['X-Powered-By']).toEqual('Other')
    expect(response.headers['Strict-Transport-Security']).toEqual('max-age=15552000')
    expect(response.headers['X-XSS-Protection']).toEqual('1; mode=block; report=https://example.com/report')
  })

  test('It should catch thrown errors', async () => {
    const handler = middy(async () => {
      throw new Error('This error should not return 200')
    })

    handler.use(httpSecurityHeaders())

    const event = {
      httpMethod: 'GET'
    }

    const response = await invoke(handler, event)
    expect(response.statusCode).toEqual(500)
  })
})
