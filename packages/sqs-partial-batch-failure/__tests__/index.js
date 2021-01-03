import test from 'ava'
import sinon from 'sinon'
import createEvent from '@serverless/event-mocks'

import middy from '../../core/index.js'
import { clearCache } from '../../core/util.js'
import SQS from 'aws-sdk/clients/sqs.js' // v2
//import { SQS } from '@aws-sdk/client-sqs' // v3
import sqsPartialBatchFailure from '../index.js'

process.env.AWS_REGION = 'ca-central-1'

let sandbox
test.beforeEach(t => {
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
  if (responseTwo) mock.onSecondCall().returns({ promise: () => Promise.resolve(responseTwo) })
  client.prototype.deleteMessageBatch = mock
  // aws-sdk v3
  // const mock = sandbox.stub(client.prototype, 'getSecretValue')
  // mock.onFirstCall().resolves(responseOne)
  // if (responseTwo) mock.onSecondCall().resolves(responseTwo)

  return mock
}

const originalHandler = async (e) => {
  const processedRecords = e.Records.map(async (r) => {
    if (r.messageAttributes.resolveOrReject.stringValue === 'resolve') return r.messageId
    throw new Error('Error message...')
  })
  return Promise.allSettled(processedRecords)
}

test.serial('Should resolve when there are no failed messages', async (t) => {
  const event = createEvent.default(
    'aws:sqs',
    {
      Records: [{
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'resolve'
          }
        },
        body: ''
      }]
    }
  )
  mockService(SQS,{})
  const handler = middy(originalHandler)
    .use(sqsPartialBatchFailure({
      AwsClient: SQS,
    }))

  const res = await handler(event)
  t.deepEqual(res, [
    {
      status: 'fulfilled',
      value: '059f36b4-87a3-44ab-83d2-661975830a7d'
    }
  ])
})

test.serial('Should resolve when there are no failed messages, prefetch disabled', async (t) => {
  const event = createEvent.default(
    'aws:sqs',
    {
      Records: [{
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'resolve'
          }
        },
        body: ''
      }]
    }
  )
  mockService(SQS,{})
  const handler = middy(originalHandler)
    .use(sqsPartialBatchFailure({
      AwsClient: SQS,
      disablePrefetch: true
    }))

  const res = await handler(event)
  t.deepEqual(res, [
    {
      status: 'fulfilled',
      value: '059f36b4-87a3-44ab-83d2-661975830a7d'
    }
  ])
})

test.serial('Should throw with failure reasons', async (t) => {
  const event = createEvent.default(
    'aws:sqs',
    {
      Records: [{
        receiptHandle: 'successfulMessageReceiptHandle',
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'resolve'
          }
        }
      }, {
        messageAttributes: {
          resolveOrReject: {
            stringValue: 'reject'
          }
        }
      }]
    }
  )
  const mock = mockService(SQS,{})
  const handler = middy(originalHandler)
    .use(sqsPartialBatchFailure({
      AwsClient: SQS
    }))
  try {
    await handler(event)
  } catch (e) {
    t.is(e.message, 'Error message...')
    t.is(mock.callCount, 1)
    t.true(mock.calledWith({
      Entries: [ { Id: '0', ReceiptHandle: 'successfulMessageReceiptHandle' } ],
      QueueUrl: 'https://sqs.us-west-2.amazonaws.com/123456789012/my-queue'
    }))
  }
})

