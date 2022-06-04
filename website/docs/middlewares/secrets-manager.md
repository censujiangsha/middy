---
title: secrets-manager
---

This middleware fetches secrets from [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html).

Secrets to fetch can be defined by by name. See AWS docs [here](https://docs.aws.amazon.com/secretsmanager/latest/userguide/tutorials_basic.html).

Secrets are assigned to the function handler's `context` object.

The Middleware makes a single [API request](https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html) for each secret as Secrets Manager does not support batch get.

For each secret, you also provide the name under which its value should be added to `context`.

## Install

To install this middleware you can use NPM:

```bash npm2yarn
npm install --save @middy/secrets-manager
```

## Options

- `AwsClient` (object) (default `AWS.SecretsManager`): AWS.SecretsManager class constructor (e.g. that has been instrumented with AWS XRay). Must be from `aws-sdk` v2.
- `awsClientOptions` (object) (optional): Options to pass to AWS.SecretsManager class constructor.
- `awsClientAssumeRole` (string) (optional): Internal key where secrets are stored. See [@middy/sts](/docs/middlewares/sts) on to set this.
- `awsClientCapture` (function) (optional): Enable XRay by passing `captureAWSClient` from `aws-xray-sdk` in.
- `fetchData` (object) (required): Mapping of internal key name to API request parameter `SecretId`.
- `disablePrefetch` (boolean) (default `false`): On cold start requests will trigger early if they can. Setting `awsClientAssumeRole` disables prefetch.
- `cacheKey` (string) (default `secrets-manager`): Cache key for the fetched data responses. Must be unique across all middleware.
- `cacheExpiry` (number) (default `-1`): How long fetch data responses should be cached for. `-1`: cache forever, `0`: never cache, `n`: cache for n ms.
- `setToContext` (boolean) (default `false`): Store secrets to `request.context`.

NOTES:
- Lambda is required to have IAM permission for `secretsmanager:GetSecretValue`

## Sample usage

```javascript
import middy from '@middy/core'
import secretsManager from '@middy/secrets-manager'

const handler = middy((event, context) => {
  return {}
})

handler.use(secretsManager({
  fetchData: {
    apiToken: 'dev/api_token'
  },
  awsClientOptions: {
    region: 'us-east-1',
  },
  setToContext: true,
}))

// Before running the function handler, the middleware will fetch from Secrets Manager
handler(event, context, (_, response) => {
  // assuming the dev/api_token has two keys, 'Username' and 'Password'
  t.is(context.apiToken.Username,'username')
  t.is(context.apiToken.Password,'password')
})
```

## Bundling
To exclude `aws-sdk` add `aws-sdk/clients/secretsmanager.js` to the exclude list.
