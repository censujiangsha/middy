<div align="center">
  <h1>Middy http-urlencode-body-parser middleware</h1>
  <img alt="Middy logo" src="https://raw.githubusercontent.com/middyjs/middy/main/docs/img/middy-logo.svg"/>
  <p><strong>HTTP URL encode body parser middleware for the middy framework, the stylish Node.js middleware engine for AWS Lambda</strong></p>
<p>
  <a href="https://www.npmjs.com/package/@middy/http-urlencode-body-parser?activeTab=versions">
    <img src="https://badge.fury.io/js/%40middy%2Fhttp-urlencode-body-parser.svg" alt="npm version" style="max-width:100%;">
  </a>
  <a href="https://packagephobia.com/result?p=@middy/http-urlencode-body-parser">
    <img src="https://packagephobia.com/badge?p=@middy/http-urlencode-body-parser" alt="npm install size" style="max-width:100%;">
  </a>
  <a href="https://github.com/middyjs/middy/actions">
    <img src="https://github.com/middyjs/middy/workflows/Tests/badge.svg" alt="GitHub Actions test status badge" style="max-width:100%;">
  </a>
  <br/>
   <a href="https://standardjs.com/">
    <img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="Standard Code Style"  style="max-width:100%;">
  </a>
  <a href="https://snyk.io/test/github/middyjs/middy">
    <img src="https://snyk.io/test/github/middyjs/middy/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/middyjs/middy" style="max-width:100%;">
  </a>
  <a href="https://lgtm.com/projects/g/middyjs/middy/context:javascript">
    <img src="https://img.shields.io/lgtm/grade/javascript/g/middyjs/middy.svg?logo=lgtm&logoWidth=18" alt="Language grade: JavaScript" style="max-width:100%;">
  </a>
  <a href="https://bestpractices.coreinfrastructure.org/projects/5280">
    <img src="https://bestpractices.coreinfrastructure.org/projects/5280/badge" alt="Core Infrastructure Initiative (CII) Best Practices"  style="max-width:100%;">
  </a>
  <br/>
  <a href="https://gitter.im/middyjs/Lobby">
    <img src="https://badges.gitter.im/gitterHQ/gitter.svg" alt="Chat on Gitter" style="max-width:100%;">
  </a>
  <a href="https://stackoverflow.com/questions/tagged/middy?sort=Newest&uqlId=35052">
    <img src="https://img.shields.io/badge/StackOverflow-[middy]-yellow" alt="Ask questions on StackOverflow" style="max-width:100%;">
  </a>
</p>
</div>

This middleware automatically parses HTTP requests with URL-encoded body (typically the result
of a form submit).


## Install

To install this middleware you can use NPM:

```bash
npm install --save @middy/http-urlencode-body-parser
```

## Sample usage

```javascript
import middy from '@middy/core'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import httpUrlEncodeBodyParser from '@middy/http-urlencode-body-parser'

const handler = middy((event, context) => {
  return event.body // propagates the body as response
})

handler
  .use(httpHeaderNormalizer())
  .use(httpUrlEncodeBodyParser())

// When Lambda runs the handler with a sample event...
const event = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'frappucino=muffin&goat%5B%5D=scone&pond=moose'
}

handler(event, {}, (_, body) => {
  t.deepEqual(body, {
    frappucino: 'muffin',
    'goat[]': 'scone',
    pond: 'moose'
  })
})
```


## Middy documentation and examples

For more documentation and examples, refers to the main [Middy monorepo on GitHub](https://github.com/middyjs/middy) or [Middy official website](https://middy.js.org).


## Contributing

Everyone is very welcome to contribute to this repository. Feel free to [raise issues](https://github.com/middyjs/middy/issues) or to [submit Pull Requests](https://github.com/middyjs/middy/pulls).


## License

Licensed under [MIT License](LICENSE). Copyright (c) 2017-2022 Luciano Mammino, will Farrell, and the [Middy team](https://github.com/middyjs/middy/graphs/contributors).

<a href="https://app.fossa.io/projects/git%2Bgithub.com%2Fmiddyjs%2Fmiddy?ref=badge_large">
  <img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmiddyjs%2Fmiddy.svg?type=large" alt="FOSSA Status"  style="max-width:100%;">
</a>
