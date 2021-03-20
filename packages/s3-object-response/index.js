const https = require('https')
const { URL } = require('url')
const { PassThrough, pipeline } = require('stream')
const eventEmitter = require('events')

const {
  canPrefetch,
  createPrefetchClient,
  createClient
} = require('@middy/util')

const S3 = require('aws-sdk/clients/s3.js') // v2
// const { S3 } = require('@aws-sdk/client-s3') // v3

const defaults = {
  AwsClient: S3, // Allow for XRay
  awsClientOptions: {},
  awsClientAssumeRole: undefined,
  awsClientCapture: undefined,
  disablePrefetch: false,
  setToContext: false
}

const s3ObjectResponseMiddleware = (opts = {}) => {
  const options = { ...defaults, ...opts }

  let client
  if (canPrefetch(options)) {
    client = createPrefetchClient(options)
  }

  const s3ObjectResponseMiddlewareBefore = async (request) => {
    if (!client) {
      client = await createClient(options, request)
    }

    const { inputS3Url, outputRoute, outputToken } = request.event.getObjectContext

    const s3ObjectResponse = {
      outputRoute,
      outputToken
    }

    const parsedInputS3Url = new URL(inputS3Url)
    const fetchOptions = {
      method: 'GET',
      host: parsedInputS3Url.hostname,
      path: parsedInputS3Url.pathname
    }

    if (options.setToContext) {
      request.context.s3Object = await fetchPromise(fetchOptions)
    } else {
      s3ObjectResponse.readStream = fetchStream(fetchOptions)
    }
    request.internal.s3ObjectResponse = s3ObjectResponse
  }

  const s3ObjectResponseMiddlewareAfter = async (request) => {
    const { readStream, outputRoute, outputToken } = request.internal.s3ObjectResponse

    let body = request.response.Body
    if (isWritableStream(request.response.Body)) {
      body = pipeline(readStream, body)
    }

    return client.writeGetObjectResponse({
      ...request.response,
      RequestRoute: outputRoute,
      RequestToken: outputToken,
      Body: body
    })
  }

  return {
    before: s3ObjectResponseMiddlewareBefore,
    after: s3ObjectResponseMiddlewareAfter
  }
}

const fetchStream = (options) => {
  return https.request(options)
}

const fetchPromise = (options) => {
  return new Promise((resolve, reject) => {
    let data = ''
    const stream = fetchStream(options)
    stream.on('data', chunk => { data += chunk })
    stream.on('end', () => resolve(data))
    stream.on('error', error => reject(error))
  })
}

const isWritableStream = (body) => {
  return body instanceof eventEmitter && typeof body.write === 'function' && typeof body.end === 'function'
}

module.exports = s3ObjectResponseMiddleware
