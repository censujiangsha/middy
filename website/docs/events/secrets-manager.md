---
title: Secrets Manager
---

:::caution

This page is a work in progress. If you want to help us to make this page better, please consider contributing on GitHub.

:::

## AWS Documentation
- [Using AWS Lambda with Secrets Manager](https://docs.aws.amazon.com/lambda/latest/dg/with-secrets-manager.html)

## Example
```javascript
import middy from '@middy/core'

export const handler = middy()
  .handler((event, context, {signal}) => {
    // ...
  })
```
