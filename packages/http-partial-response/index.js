import jsonMask from 'json-mask'
const compile = jsonMask.compile
const filter = jsonMask.filter

const defaults = {
  filteringKeyName: 'fields'
}

export default (opts = {}) => {
  const options = Object.assign({}, defaults, opts)
  const { filteringKeyName } = options

  const httpPartialResponseMiddlewareAfter = async (handler) => {
    const params = getFilterParams(handler, filteringKeyName)

    if (!isResponseFilterable(params)) return

    let { body, fields } = params
    const isBodyStringified = isJson(body)

    body = isBodyStringified ? JSON.parse(body) : body

    const filteredBody = filter(body, compile(fields))

    handler.response.body = isBodyStringified
      ? JSON.stringify(filteredBody)
      : filteredBody
  }
  return {
    after: httpPartialResponseMiddlewareAfter
  }
}

const getFilterParams = (handler, filteringKeyName) => {
  const { body } = handler.response || {}
  const { queryStringParameters } = handler.event || {}
  const fields = queryStringParameters
    ? queryStringParameters[filteringKeyName]
    : undefined

  return {
    body,
    fields
  }
}

const isJson = str => {
  try {
    return JSON.parse(str) && true
  } catch (err) {
    return false
  }
}

const isResponseFilterable = params => {
  const { body, fields } = params

  if (!body) return false
  if (!isJson(body) && typeof body !== 'object') return false
  if (!fields) return false

  return true
}
