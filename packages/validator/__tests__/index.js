import test from 'ava'
import middy from '../../core/index.js'
import validator from '../index.js'

const event = {}
const context = {
  getRemainingTimeInMillis: () => 1000,
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: '$LATEST',
  functionName: 'lambda',
  memoryLimitInMB: '128',
  logGroupName: '/aws/lambda/lambda',
  logStreamName: '2022/04/01/[$LATEST]7a7ac3439a3b4635ba18460a3c7cea81',
  clientContext: undefined,
  identity: undefined,
  invokedFunctionArn:
    'arn:aws:lambda:ca-central-1:000000000000:function:lambda',
  awsRequestId: '00000000-0000-0000-0000-0000000000000'
}
const contextSchema = {
  type: 'object',
  properties: {
    getRemainingTimeInMillis: {
      typeof: 'function'
    },
    functionVersion: {
      type: 'string'
    },
    invokedFunctionArn: {
      type: 'string'
    },
    memoryLimitInMB: {
      type: 'string'
    },
    awsRequestId: {
      type: 'string'
    },
    logGroupName: {
      type: 'string'
    },
    logStreamName: {
      type: 'string'
    },
    identity: {
      type: 'object',
      properties: {
        cognitoIdentityId: {
          type: 'string'
        },
        cognitoIdentityPoolId: {
          type: 'string'
        }
      },
      required: ['cognitoIdentityId', 'cognitoIdentityPoolId']
    },
    clientContext: {
      type: 'object',
      properties: {
        'client.installation_id': {
          type: 'string'
        },
        'client.app_title': {
          type: 'string'
        },
        'client.app_version_name': {
          type: 'string'
        },
        'client.app_version_code': {
          type: 'string'
        },
        'client.app_package_name': {
          type: 'string'
        },
        'env.platform_version': {
          type: 'string'
        },
        'env.platform': {
          type: 'string'
        },
        'env.make': {
          type: 'string'
        },
        'env.model': {
          type: 'string'
        },
        'env.locale': {
          type: 'string'
        }
      },
      required: [
        'client.installation_id',
        'client.app_title',
        'client.app_version_name',
        'client.app_version_code',
        'client.app_package_name',
        'env.platform_version',
        'env.platform',
        'env.make',
        'env.model',
        'env.locale'
      ]
    },
    callbackWaitsForEmptyEventLoop: {
      type: 'boolean'
    }
  },
  required: [
    'getRemainingTimeInMillis',
    'functionVersion',
    'invokedFunctionArn',
    'memoryLimitInMB',
    'awsRequestId',
    'logGroupName',
    'logStreamName',
    'callbackWaitsForEmptyEventLoop'
  ]
}

test('It should validate an event object', async (t) => {
  const handler = middy((event, context) => {
    return event.body // propagates the body as a response
  })

  const schema = {
    type: 'object',
    required: ['body'],
    properties: {
      body: {
        type: 'object',
        properties: {
          string: {
            type: 'string'
          },
          boolean: {
            type: 'boolean'
          },
          integer: {
            type: 'integer'
          },
          number: {
            type: 'number'
          }
        }
      }
    }
  }

  handler.use(
    validator({
      eventSchema: schema
    })
  )

  // invokes the handler
  const event = {
    body: {
      string: JSON.stringify({ foo: 'bar' }),
      boolean: 'true',
      integer: '0',
      number: '0.1'
    }
  }

  const body = await handler(event, context)

  t.deepEqual(body, {
    boolean: true,
    integer: 0,
    number: 0.1,
    string: '{"foo":"bar"}'
  })
})

test('It should handle invalid schema as a BadRequest', async (t) => {
  const handler = middy((event, context) => {
    return event.body // propagates the body as a response
  })

  const schema = {
    type: 'object',
    required: ['body', 'foo'],
    properties: {
      // this will pass validation
      body: {
        type: 'string'
      },
      // this won't as it won't be in the event
      foo: {
        type: 'string'
      }
    }
  }

  handler.use(
    validator({
      eventSchema: schema
    })
  )

  // invokes the handler, note that property foo is missing
  const event = {
    body: JSON.stringify({ something: 'somethingelse' })
  }

  try {
    await handler(event, context)
  } catch (e) {
    t.is(e.message, 'Event object failed validation')
    t.deepEqual(e.cause, [
      {
        instancePath: '',
        keyword: 'required',
        message: 'must have required property foo',
        params: { missingProperty: 'foo' },
        schemaPath: '#/required'
      }
    ])
  }
})

test('It should handle invalid schema as a BadRequest in a different language', async (t) => {
  const handler = middy((event, context) => {
    return event.body // propagates the body as a response
  })

  const schema = {
    type: 'object',
    required: ['body', 'foo'],
    properties: {
      // this will pass validation
      body: {
        type: 'string'
      },
      // this won't as it won't be in the event
      foo: {
        type: 'string'
      }
    }
  }

  handler.use(
    validator({
      eventSchema: schema
    })
  )

  const cases = [
    { lang: 'fr', message: 'requiert la propriété foo' },
    { lang: 'zh', message: '应当有必需属性 foo' },
    { lang: 'zh-TW', message: '應該有必須屬性 foo' }
  ]

  for (const c of cases) {
    // invokes the handler, note that property foo is missing
    const event = {
      preferredLanguage: c.lang,
      body: JSON.stringify({ something: 'somethingelse' })
    }

    try {
      await handler(event, context)
    } catch (e) {
      t.is(e.message, 'Event object failed validation')
      t.deepEqual(e.cause, [
        {
          instancePath: '',
          keyword: 'required',
          message: c.message,
          params: { missingProperty: 'foo' },
          schemaPath: '#/required'
        }
      ])
    }
  }
})

test('It should handle invalid schema as a BadRequest in a different language (with normalization)', async (t) => {
  const handler = middy((event, context) => {
    return event.body // propagates the body as a response
  })

  const schema = {
    type: 'object',
    required: ['body', 'foo'],
    properties: {
      // this will pass validation
      body: {
        type: 'string'
      },
      // this won't as it won't be in the event
      foo: {
        type: 'string'
      }
    }
  }

  handler.use(
    validator({
      eventSchema: schema
    })
  )

  // invokes the handler, note that property foo is missing
  const event = {
    preferredLanguage: 'pt',
    body: JSON.stringify({ something: 'somethingelse' })
  }

  try {
    await handler(event, context)
  } catch (e) {
    t.is(e.message, 'Event object failed validation')
    t.deepEqual(e.cause, [
      {
        instancePath: '',
        keyword: 'required',
        message: 'deve ter a propriedade obrigatória foo',
        params: { missingProperty: 'foo' },
        schemaPath: '#/required'
      }
    ])
  }
})

test('It should handle invalid schema as a BadRequest without i18n', async (t) => {
  const handler = middy((event, context) => {
    return event.body // propagates the body as a response
  })

  const schema = {
    type: 'object',
    required: ['body', 'foo'],
    properties: {
      // this will pass validation
      body: {
        type: 'string'
      },
      // this won't as it won't be in the event
      foo: {
        type: 'string'
      }
    }
  }

  handler.use(
    validator({
      eventSchema: schema,
      i18nEnabled: false
    })
  )

  // invokes the handler, note that property foo is missing
  const event = {
    preferredLanguage: 'pt',
    body: JSON.stringify({ something: 'somethingelse' })
  }

  try {
    await handler(event, context)
  } catch (e) {
    t.is(e.message, 'Event object failed validation')
    t.deepEqual(e.cause, [
      {
        instancePath: '',
        keyword: 'required',
        params: { missingProperty: 'foo' },
        schemaPath: '#/required'
      }
    ])
  }
})

test('It should validate context object', async (t) => {
  const expectedResponse = {
    body: 'Hello world',
    statusCode: 200
  }

  const handler = middy((event, context) => {
    return expectedResponse
  })

  handler.use(validator({ contextSchema }))

  const response = await handler(event, context)

  t.deepEqual(response, expectedResponse)
})

test('It should make requests with invalid context fails with an Internal Server Error', async (t) => {
  const handler = middy((event, context) => {
    return {}
  })

  handler
    .before((request) => {
      request.context.callbackWaitsForEmptyEventLoop = 'fail'
    })
    .use(validator({ contextSchema }))

  let response

  try {
    response = await handler(event, context)
  } catch (e) {
    t.not(e, null)
    t.is(e.message, 'Context object failed validation')
    t.not(response, null) // it doesn't destroy the response so it gets logged
  }
})

test('It should validate response object', async (t) => {
  const expectedResponse = {
    body: 'Hello world',
    statusCode: 200
  }

  const handler = middy((event, context) => {
    return expectedResponse
  })

  const schema = {
    type: 'object',
    required: ['body', 'statusCode'],
    properties: {
      body: {
        type: 'string'
      },
      statusCode: {
        type: 'number'
      }
    }
  }

  handler.use(validator({ responseSchema: schema }))

  const response = await handler(event, context)

  t.deepEqual(response, expectedResponse)
})

test('It should make requests with invalid responses fail with an Internal Server Error', async (t) => {
  const handler = middy((event, context) => {
    return {}
  })

  const schema = {
    type: 'object',
    required: ['body', 'statusCode'],
    properties: {
      body: {
        type: 'object'
      },
      statusCode: {
        type: 'number'
      }
    }
  }

  handler.use(validator({ responseSchema: schema }))

  let response

  try {
    response = await handler(event, context)
  } catch (e) {
    t.not(e, null)
    t.is(e.message, 'Response object failed validation')
    t.not(response, null) // it doesn't destroy the response so it gets logged
  }
})

test('It should not allow bad email format', async (t) => {
  const schema = {
    type: 'object',
    required: ['email'],
    properties: { email: { type: 'string', format: 'email' } }
  }
  const handler = middy((event, context) => {
    return {}
  })

  handler.use(validator({ eventSchema: schema }))

  const event = { email: 'abc@abc' }
  try {
    // This same email is not a valid one in 'full' validation mode
    await handler(event, context)
  } catch (e) {
    t.is(e.cause[0].message, 'must match format "email"')
  }
})

test('It should error when unsupported keywords used (input)', async (t) => {
  const schema = {
    type: 'object',
    somethingnew: 'must be an object with an integer property foo only'
  }

  const handler = middy((event, context) => {
    return {}
  })

  const event = { foo: 'a' }
  try {
    handler.use(validator({ eventSchema: schema }))
    await handler(event, context)
  } catch (e) {
    t.is(e.message, 'strict mode: unknown keyword: "somethingnew"')
  }
})

test('It should error when unsupported keywords used (output)', async (t) => {
  const schema = {
    type: 'object',
    somethingnew: 'must be an object with an integer property foo only'
  }

  const handler = middy((event, context) => {
    return {}
  })

  const event = { foo: 'a' }
  try {
    handler.use(validator({ responseSchema: schema }))
    await handler(event.context)
  } catch (e) {
    t.is(e.message, 'strict mode: unknown keyword: "somethingnew"')
  }
})

// TODO Not support yet with ajv v7
/* test('It should use out-of-the-box ajv-errors plugin', async (t) => {
  const schema = {
    type: 'object',
    required: ['foo'],
    properties: {
      foo: { type: 'integer' }
    },
    errorMessage: 'must be an object with an integer property foo only'
  }

  const handler = middy((event, context) => {
    return {}
  })

  handler.use(validator({ eventSchema: schema }))

  try {
    await handler({ foo: 'a' })
  } catch (e) {
    t.is(e.message, 'Event object failed validation')
    t.deepEqual(e.cause, [{
      instancePath: '',
      keyword: 'errorMessage',
      params: {
        errors: [{
          instancePath: '/foo',
          emUsed: true,
          keyword: 'type',
          params: {
            type: 'integer',
          },
          schemaPath: '#/properties/foo/type'
        }]
      },
      schemaPath: '#/errorMessage',
      message: 'must be an object with an integer property foo only'
    }])
  }
}) */
