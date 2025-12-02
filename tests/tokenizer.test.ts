import { describe, it, expect } from 'vitest'
import { Token, Tokenizer } from '../src/tokenizer'

const basicCases = [
  {
    input: '0',
    tokens: ['PLACEHOLDER:0']
  },
  {
    input: '#',
    tokens: ['PLACEHOLDER:#']
  },
  {
    input: '?',
    tokens: ['PLACEHOLDER:?']
  },
  {
    input: '00.00',
    tokens: [
      'PLACEHOLDER:0',
      'PLACEHOLDER:0',
      'DOT:.',
      'PLACEHOLDER:0',
      'PLACEHOLDER:0'
    ]
  }
]

const literalCases = [
  {
    input: '"Hello"',
    tokens: ['LITERAL:Hello']
  },
  {
    input: '"He said ""Yes"""',
    tokens: ['LITERAL:He said "Yes"']
  },
  {
    input: '"%"',
    tokens: ['LITERAL:%']
  }
]
const escapeCases = [
  {
    input: '\\-',
    tokens: ['LITERAL:-']
  },
  {
    input: '\\ ',
    tokens: ['LITERAL: ']
  },
  {
    input: '\\(',
    tokens: ['LITERAL:(']
  }
]
const conditionCases = [
  {
    input: '[>100]0',
    tokens: ['COND_OP:>', 'COND_NUM:100', 'PLACEHOLDER:0']
  },
  {
    input: '[<=0]#,##0',
    tokens: [
      'COND_OP:<=',
      'COND_NUM:0',
      'PLACEHOLDER:#',
      'COMMA:,',
      'PLACEHOLDER:#',
      'PLACEHOLDER:#',
      'PLACEHOLDER:0'
    ]
  }
]
const colorCases = [
  {
    input: '[Red]0',
    tokens: ['COLOR:Red', 'PLACEHOLDER:0']
  },
  {
    input: '[Blue][>0]0.00',
    tokens: [
      'COLOR:Blue',
      'COND_OP:>',
      'COND_NUM:0',
      'PLACEHOLDER:0',
      'DOT:.',
      'PLACEHOLDER:0',
      'PLACEHOLDER:0'
    ]
  }
]
const currencyCases = [
  {
    input: '$0',
    tokens: ['LITERAL:$', 'PLACEHOLDER:0']
  },
  {
    input: '¥#,##0',
    tokens: [
      'LITERAL:¥',
      'PLACEHOLDER:#',
      'COMMA:,',
      'PLACEHOLDER:#',
      'PLACEHOLDER:#',
      'PLACEHOLDER:0'
    ]
  }
]
const specialCases = [
  {
    input: '#,##0',
    tokens: [
      'PLACEHOLDER:#',
      'COMMA:,',
      'PLACEHOLDER:#',
      'PLACEHOLDER:#',
      'PLACEHOLDER:0'
    ]
  },
  {
    input: '0%',
    tokens: ['PLACEHOLDER:0', 'PERCENT:%']
  },
  {
    input: '0.00E+00',
    tokens: [
      'PLACEHOLDER:0',
      'DOT:.',
      'PLACEHOLDER:0',
      'PLACEHOLDER:0',
      'EXP:E',
      'PLUS:+',
      'PLACEHOLDER:0',
      'PLACEHOLDER:0'
    ]
  }
]
const datetimeCases = [
  {
    input: 'yyyy-mm-dd',
    tokens: ['DATE:yyyy', 'LITERAL:-', 'DATE:mm', 'LITERAL:-', 'DATE:dd']
  },
  {
    input: 'hh:mm:ss',
    tokens: ['DATE:hh', 'LITERAL::', 'DATE:mm', 'LITERAL::', 'DATE:ss']
  }
]

const sectionCases = [
  {
    input: '0;[Red]0;"-"',
    tokens: [
      'PLACEHOLDER:0',
      'SECTION:;',
      'COLOR:Red',
      'PLACEHOLDER:0',
      'SECTION:;',
      'LITERAL:-'
    ]
  }
]

const complexCases = [
  {
    input: '[Green][>100]$#,##0.00" USD";[Red][<=100]0.00;"N/A"',
    tokens: [
      'COLOR:Green',
      'COND_OP:>',
      'COND_NUM:100',
      'LITERAL:$',
      'PLACEHOLDER:#',
      'COMMA:,',
      'PLACEHOLDER:#',
      'PLACEHOLDER:#',
      'PLACEHOLDER:0',
      'DOT:.',
      'PLACEHOLDER:0',
      'PLACEHOLDER:0',
      'LITERAL: USD',
      'SECTION:;',
      'COLOR:Red',
      'COND_OP:<=',
      'COND_NUM:100',
      'PLACEHOLDER:0',
      'DOT:.',
      'PLACEHOLDER:0',
      'PLACEHOLDER:0',
      'SECTION:;',
      'LITERAL:N/A'
    ]
  }
]

const allTestGroups: [string, { input: string; tokens: string[] }[]][] = [
  ['Basic', basicCases],
  ['Literal', literalCases],
  ['Escape', escapeCases],
  ['Condition', conditionCases],
  ['Color', colorCases],
  ['Currency', currencyCases],
  ['Special', specialCases],
  ['DateTime', datetimeCases],
  ['Section', sectionCases],
  ['Complex', complexCases]
]

function stringifyToken(t: Token) {
  switch (t.type) {
    case 'SectionSeparator':
      return 'SECTION:;'
    case 'Placeholder':
      return 'PLACEHOLDER:' + t.char
    case 'DecimalPoint':
      return 'DOT:.'
    case 'ThousandSep':
      return 'COMMA:,'
    case 'Percent':
      return 'PERCENT:%'
    case 'TextPlaceholder':
      return 'TextPlaceholder:@'
    case 'Literal':
      return 'LITERAL:' + t.char
    case 'Quoted':
      return 'LITERAL:' + t.text
    case 'Escape':
      return 'LITERAL:' + t.char
    case 'Fill':
      return 'FILL:' + t.char
    case 'Space':
      return 'SPACE:' + t.char
    case 'Condition':
      return ['COND_OP:' + t.op, 'COND_NUM:' + t.value]
    case 'Color':
      return 'COLOR:' + t.name
    case 'Locale':
      return 'LOCALE:' + t.raw
    case 'ScientificSymbol':
      const res = ['EXP:E']
      switch (t.sign) {
        case '+':
          res.push('PLUS:+')
          break
        case '-':
          res.push('MINUS:-')
          break
      }
      return res
    case 'DateToken':
      return 'DATE:' + t.token
  }
}

function stringifyTokens(tks: Token[]) {
  const result: string[] = []
  tks.forEach((t) => {
    const s = stringifyToken(t)
    if (typeof s === 'string') {
      result.push(s)
    } else {
      result.push(...s)
    }
  })
  return result
}

describe('tokenize', () => {
  allTestGroups.forEach(([name, cases]) => {
    describe(name as string, () => {
      cases.forEach(({ input, tokens }, idx) => {
        it(`Case #${idx}: "${input}"`, () => {
          const result = stringifyTokens(new Tokenizer(input).tokenize())
          expect(result).toEqual(tokens)
        })
      })
    })
  })
})
