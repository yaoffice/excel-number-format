import { inspect } from 'util'
import { parse } from '../src/parser'
import { describe, expect, it } from 'vitest'

describe('simple', () => {
  it('number padding', () => {
    console.log(inspect(parse('"OK"&#%00'), false, 10))
  })
})
