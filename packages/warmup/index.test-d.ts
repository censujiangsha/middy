import { expectType } from 'tsd'
import middy from '@middy/core'
import warmup from '.'

// use with default options
let middleware = warmup()
expectType<middy.MiddlewareObj>(middleware)

// use with all options
middleware = warmup({
  isWarmingUp: () => true
})
expectType<middy.MiddlewareObj>(middleware)
