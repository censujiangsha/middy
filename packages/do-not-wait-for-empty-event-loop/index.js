
const defaults = {
  runOnBefore: true,
  runOnAfter: false,
  runOnError: false
}

const doNotWaitForEmptyEventLoopMiddleware = (opts = {}) => {
  const options = { ...defaults, ...opts }

  const doNotWaitForEmptyEventLoop = async (request) => {
    request.context.callbackWaitsForEmptyEventLoop = false
  }

  return {
    before: options.runOnBefore ? doNotWaitForEmptyEventLoop : undefined,
    after: options.runOnAfter ? doNotWaitForEmptyEventLoop : undefined,
    onError: options.runOnError ? doNotWaitForEmptyEventLoop : undefined
  }
}
export default doNotWaitForEmptyEventLoopMiddleware
