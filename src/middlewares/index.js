module.exports = {
  cache: require('./cache'),
  cors: require('./cors'),
  doNotWaitForEmptyEventLoop: require('./doNotWaitForEmptyEventLoop'),
  httpErrorHandler: require('./httpErrorHandler'),
  httpEventNormalizer: require('./httpEventNormalizer'),
  httpHeaderNormalizer: require('./httpHeaderNormalizer'),
  jsonBodyParser: require('./jsonBodyParser'),
  s3KeyNormalizer: require('./s3KeyNormalizer'),
  ssm: require('./ssm'),
  urlEncodeBodyParser: require('./urlEncodeBodyParser'),
  validator: require('./validator'),
  warmup: require('./warmup')
}
