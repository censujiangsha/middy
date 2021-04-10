const middy = require('@middy/core')
const cloudwatchMetricsMiddleware = require('cloudwatch-metrics')
const errorLoggerMiddleware = require('error-logger')
const inputOutputLoggerMiddleware = require('input-output-logger')

const handler = middy()
  .use(cloudwatchMetricsMiddleware())
  .use(errorLoggerMiddleware())
  .use(inputOutputLoggerMiddleware())

module.exports = { handler }
