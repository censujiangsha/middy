const test = require('ava')
const sinon = require('sinon')
const createEvent = require('@serverless/event-mocks')

const middy = require('../../core/index.js')
const sqsPartialBatchFailure = require('../index.js')

const baseHandler = async (e) => {
  const processedRecords = e.Records.map(async (r) => {
    if (r.messageAttributes.resolveOrReject.stringValue === 'resolve') {
      return r.messageId
    }
    throw new Error('record')
  })
  return Promise.allSettled(processedRecords)
}

test('Should return when there are only failed messages', async (t) => {
  const event = createEvent.default('aws:sqs', {
    Records: [
      {
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'reject'
          }
        },
        body: ''
      }
    ]
  })
  const logger = sinon.spy()

  const handler = middy(baseHandler)
    .use(sqsPartialBatchFailure({  logger  }))

  const response = await handler(event)

  t.deepEqual(response, { batchItemFailures: event.Records.map(r => ({ itemIdentifier: r.messageId })) })
  t.is(logger.callCount, 1)
})

test('Should resolve when there are no failed messages', async (t) => {
  const event = createEvent.default('aws:sqs', {
    Records: [
      {
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'resolve'
          }
        },
        body: ''
      }
    ]
  })
  const logger = sinon.spy()

  const handler = middy(baseHandler)
    .use(sqsPartialBatchFailure({  logger  }))

  const response = await handler(event)
  t.deepEqual(response, { batchItemFailures: [] })
  t.is(logger.callCount, 0)
})

test('Should return only the rejected messageIds', async (t) => {
  const event = createEvent.default('aws:sqs', {
    Records: [
      {
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'reject'
          }
        },
        body: ''
      },
      {
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'resolve'
          }
        },
        body: ''
      }
    ]
  })
  const logger = sinon.spy()

  const handler = middy(baseHandler)
    .use(sqsPartialBatchFailure({  logger  }))

  const response = await handler(event)
  t.deepEqual(response, { batchItemFailures: event.Records.filter(r => r.messageAttributes.resolveOrReject.stringValue === 'reject').map(r => ({ itemIdentifier: r.messageId })) })
  t.is(logger.callCount, 1)
})

/*
const { clearCache } = require('../../util')
const SQS = require('aws-sdk/clients/sqs.js') // v2
// const { SQS } = require('@aws-sdk/client-sqs') // v3
const sqsPartialBatchFailure = require('../index.js')

process.env.AWS_REGION = 'ca-central-1'

let sandbox
test.beforeEach((t) => {
  sandbox = sinon.createSandbox()
})

test.afterEach((t) => {
  sandbox.restore()
  clearCache()
})

const mockService = (client, responseOne, responseTwo) => {
  // aws-sdk v2
  const mock = sandbox.stub()
  mock.onFirstCall().returns({ promise: () => Promise.resolve(responseOne) })
  if (responseTwo) {
    mock.onSecondCall().returns({ promise: () => Promise.resolve(responseTwo) })
  }
  client.prototype.deleteMessageBatch = mock
  // aws-sdk v3
  // const mock = sandbox.stub(client.prototype, 'getSecretValue')
  // mock.onFirstCall().resolves(responseOne)
  // if (responseTwo) mock.onSecondCall().resolves(responseTwo)

  return mock
}

const messageError = new Error('Error message...')
const baseHandler = async (e) => {
  const processedRecords = e.Records.map(async (r) => {
    if (r.messageAttributes.resolveOrReject.stringValue === 'resolve') {
      return r.messageId
    }
    throw messageError
  })
  return Promise.allSettled(processedRecords)
}

test.serial('Should throw when there are only failed messages', async (t) => {
  const event = createEvent.default('aws:sqs', {
    Records: [
      {
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'unresolved'
          }
        },
        body: ''
      }
    ]
  })
  mockService(SQS, {})
  const handler = middy(baseHandler).use(
    sqsPartialBatchFailure({
      AwsClient: SQS
    })
  )

  try {
    await handler(event)
  } catch (e) {
    t.is(e.message, 'Failed to process SQS messages')
    t.deepEqual(e.nestedErrors, [messageError])
  }
})

test.serial('Should resolve when there are no failed messages', async (t) => {
  const event = createEvent.default('aws:sqs', {
    Records: [
      {
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'resolve'
          }
        },
        body: ''
      }
    ]
  })
  mockService(SQS, {})
  const handler = middy(baseHandler).use(
    sqsPartialBatchFailure({
      AwsClient: SQS
    })
  )

  const res = await handler(event)
  t.deepEqual(res, [
    {
      status: 'fulfilled',
      value: '059f36b4-87a3-44ab-83d2-661975830a7d'
    }
  ])
})

test.serial(
  'Should resolve when there are no failed messages, prefetch disabled',
  async (t) => {
    const event = createEvent.default('aws:sqs', {
      Records: [
        {
          messageAttributes: {
            resolveOrReject: {
              stringValue: 'resolve'
            }
          },
          body: ''
        }
      ]
    })
    mockService(SQS, {})
    const handler = middy(baseHandler).use(
      sqsPartialBatchFailure({
        AwsClient: SQS,
        disablePrefetch: true
      })
    )

    const res = await handler(event)
    t.deepEqual(res, [
      {
        status: 'fulfilled',
        value: '059f36b4-87a3-44ab-83d2-661975830a7d'
      }
    ])
  }
)

test.serial('Should throw with failure reasons', async (t) => {
  const event = createEvent.default('aws:sqs', {
    Records: [
      {
        receiptHandle: 'successfulMessageReceiptHandle',
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'resolve'
          }
        }
      },
      {
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'reject'
          }
        }
      }
    ]
  })
  const mock = mockService(SQS, {})
  const handler = middy(baseHandler).use(
    sqsPartialBatchFailure({
      AwsClient: SQS
    })
  )
  try {
    await handler(event)
  } catch (e) {
    t.is(e.message, 'Failed to process SQS messages')
    t.deepEqual(e.nestedErrors, [messageError])
    t.is(mock.callCount, 1)
    // returns false on CI, unknown why yet.
    // t.true(mock.calledWith({
    //   Entries: [ { Id: '0', ReceiptHandle: 'successfulMessageReceiptHandle' } ],
    //   QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/my-queue'
    // }))
  }
})
*/
