---
title: Bundling Lambda packages
sidebar_position: 5
---

:::caution

This page is a work in progress. If you want to help us to make this page better, please consider contributing on GitHub.

:::

Lambda runtime already includes `aws-sdk` by default and as such you normally don't need to package it in your function.

## Transpilers
### babel
```bash
npm i -D @babel/cli @babel/core @babel/preset-env
node_modules/.bin/babel index.js --out-file index.transpile.babel.cjs
```

#### babel.config.json
```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "14"
        }
      }
    ]
  ]
}
```

### esbuild
```bash
npm i -D esbuild
node_modules/.bin/esbuild --platform=node --target=node14 --format=cjs index.js --outfile=index.transpile.esbuild.cjs
```

### swc
```bash
npm i -D @swc/cli @swc/core
node_modules/.bin/swc index.js --out-file index.transpile.swc.cjs
```

#### .swcrc
```json
{
  "jsc": {
    "parser": {
      "syntax": "ecmascript"
    },
    "target": "es2020"
  },
  "module": {
    "type": "commonjs"
  }
}
```

## Bundlers
### esbuild
```bash
npm i -D esbuild
node_modules/.bin/esbuild --platform=node --format=esm --external:aws-sdk/clients/* index.js --bundle --outfile=index.bundle.esbuild.mjs
```

### rollup
```bash
npm i -D rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs
node_modules/.bin/rollup --config
```

#### rollup.config.mjs
```javascript
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const plugins = [
  nodeResolve({ preferBuiltins: true }),
  commonjs()
]

export default (input) => ({
  input: 'index.js',
  output: {
    file: 'index.bundle.rollup.mjs',
    format: 'es' // cjs, es
  },
  plugins,
  external: [
    // AWS SDK
    'aws-sdk/clients/apigatewaymanagementapi.js', // @middy/ws-response
    'aws-sdk/clients/dynamodb.js', // @middy/event-normalizer
    'aws-sdk/clients/rds.js', // @middy/rds-signer
    'aws-sdk/clients/s3.js', // @middy/s3-object-response
    'aws-sdk/clients/secretsmanager.js', // @middy/sercrets-manager
    'aws-sdk/clients/servicediscovery.js', // @middy/service-discovery
    'aws-sdk/clients/ssm.js', // @middy/ssm
    'aws-sdk/clients/sts.js' // @middy/sts
  ]
})
```

### swc/pack
```bash
npm i -D @swc/cli @swc/core
node_modules/.bin/spack
```

:::caution

Incomplete

:::

### webpack
```bash
npm i -D webpack-cli webpack
node_modules/.bin/webpack
```

#### webpack.config.mjs
```javascript
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  "mode": "development",
  "entry": "./index.js",
  "output": {
    "filename": "index.bundle.webpack.mjs",
    "path": __dirname
  },
  experiments: {
    outputModule: true,
  },
  externalsType: 'module',
  externals: [
    // NodeJS modules
    'events', // @middy/core
    'https', // @middy/s3-object-response @middy/util
    'stream', // @middy/http-content-encoding @middy/s3-object-response
    'util', // @middy/http-content-encoding
    'zlib', // @middy/http-content-encoding
    // AWS SDK
    'aws-sdk/clients/apigatewaymanagementapi.js', // @middy/ws-response
    'aws-sdk/clients/dynamodb.js', // @middy/event-normalizer
    'aws-sdk/clients/rds.js', // @middy/rds-signer
    'aws-sdk/clients/s3.js', // @middy/s3-object-response
    'aws-sdk/clients/secretsmanager.js', // @middy/sercrets-manager
    'aws-sdk/clients/servicediscovery.js', // @middy/service-discovery
    'aws-sdk/clients/ssm.js', // @middy/ssm
    'aws-sdk/clients/sts.js' // @middy/sts
  ]
}
```
