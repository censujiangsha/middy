
const defaultBaseHandler = () => {}
const defaultPlugin = {
  timeoutEarlyInMillis: 5,
  timeoutEarlyResponse: () => { throw new Error('Timeout') }
}

const middy = (baseHandler = defaultBaseHandler, plugin = {}) => {
  // Allow base handler to be set using .handler()
  if (typeof baseHandler !== 'function') {
    plugin = baseHandler
    baseHandler = defaultBaseHandler
  }
  plugin = {...defaultPlugin, ...plugin}
  
  plugin.beforePrefetch?.()
  const beforeMiddlewares = []
  const afterMiddlewares = []
  const onErrorMiddlewares = []

  const instance = (event = {}, context = {}) => {
    plugin.requestStart?.()
    const request = {
      event,
      context,
      response: undefined,
      error: undefined,
      internal: plugin.internal ?? {}
    }

    return runRequest(
      request,
      [...beforeMiddlewares],
      baseHandler,
      [...afterMiddlewares],
      [...onErrorMiddlewares],
      plugin
    )
  }

  instance.use = (middlewares) => {
    if (!Array.isArray(middlewares)) {
      middlewares = [middlewares]
    }
    for (const middleware of middlewares) {
      const { before, after, onError } = middleware

      if (!before && !after && !onError) {
        throw new Error(
          'Middleware must be an object containing at least one key among "before", "after", "onError"'
        )
      }

      if (before) instance.before(before)
      if (after) instance.after(after)
      if (onError) instance.onError(onError)
    }
    return instance
  }

  // Inline Middlewares
  instance.before = (beforeMiddleware) => {
    beforeMiddlewares.push(beforeMiddleware)
    return instance
  }
  instance.after = (afterMiddleware) => {
    afterMiddlewares.unshift(afterMiddleware)
    return instance
  }
  instance.onError = (onErrorMiddleware) => {
    onErrorMiddlewares.unshift(onErrorMiddleware)
    return instance
  }
  instance.handler = (replaceBaseHandler) => {
    baseHandler = replaceBaseHandler
  }

  return instance
}

const runRequest = async (
  request,
  beforeMiddlewares,
  baseHandler,
  afterMiddlewares,
  onErrorMiddlewares,
  plugin
) => {
  try {
    await runMiddlewares(request, beforeMiddlewares, plugin)
    // Check if before stack hasn't exit early
    if (request.response === undefined) {
      plugin.beforeHandler?.()

      const handlerAbort = new AbortController()
      const timeoutAbort = new AbortController()
      request.response = await Promise.race([
        baseHandler(request.event, request.context, { signal: handlerAbort.signal }),
        plugin.timeoutEarlyInMillis > 0
          ? setTimeoutPromise(request.context.getRemainingTimeInMillis() - plugin.timeoutEarlyInMillis, { signal: timeoutAbort.signal })
            .then(() => {
              handlerAbort.abort()
              return plugin.timeoutEarlyResponse()
            })
          : Promise.race([])
      ])
      timeoutAbort.abort() // baseHandler may not be a promise

      plugin.afterHandler?.()
      await runMiddlewares(request, afterMiddlewares, plugin)
    }
  } catch (e) {
    // Reset response changes made by after stack before error thrown
    request.response = undefined
    request.error = e
    try {
      await runMiddlewares(request, onErrorMiddlewares, plugin)
    } catch (e) {
      // Save error that wasn't handled
      e.originalError = request.error
      request.error = e

      throw request.error
    }
    // Catch if onError stack hasn't handled the error
    if (request.response === undefined) throw request.error
  } finally {
    await plugin.requestEnd?.(request)
  }

  return request.response
}

const runMiddlewares = async (request, middlewares, plugin) => {
  for (const nextMiddleware of middlewares) {
    plugin.beforeMiddleware?.(nextMiddleware.name)
    const res = await nextMiddleware(request)
    plugin.afterMiddleware?.(nextMiddleware.name)
    // short circuit chaining and respond early
    if (res !== undefined) {
      request.response = res
      return
    }
  }
}

// Start Polyfill (node v14)
const { AbortController } = require('node-abort-controller')

const setTimeoutPromise = (ms, { signal }) => {
  if (signal.aborted) {
    return Promise.reject(new Error('Aborted', 'AbortError'))
  }
  return new Promise((resolve, reject) => {
    const abortHandler = () => {
      clearTimeout(timeout)
      reject(new Error('Aborted', 'AbortError'))
    }
    // start async operation
    const timeout = setTimeout(() => {
      resolve()
      signal.removeEventListener('abort', abortHandler)
    }, ms)
    signal.addEventListener('abort', abortHandler)
  })
}
// Replace Polyfill
// const {setTimeout} = require('timers/promises')
// End Polyfill

module.exports = middy
