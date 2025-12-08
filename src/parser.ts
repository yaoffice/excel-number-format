import { Tokenizer, type Token } from './tokenizer'

export type FormatAST = {
  /**
   * Up to four sections of format codes can be specified.
   * The format codes, separated by semicolons, define the formats for positive numbers, negative numbers, zero values, and text, in that order.
   *
   * - If only two sections are specified, the first is used for positive numbers and zeros, and the second is used for negative numbers.
   * - If only one section is specified, it is used for all numbers and text.
   *
   * To skip a section, the ending semicolon for that section shall be written.
   *
   * - The first section, "Format for positive numbers", is the format code that applies to the cell when the cell value contains a positive number.
   * - The second section, "Format for negative numbers", is the format code that applies to the cell when the cell value contains a negative number.
   * - The third section, "Format for zeros", is the format code that applies to the cell when the cell value is zero.
   * - The fourth, and last, section, "Format for text", is the format code that applies to the cell when the cell value is text.
   */
  sections: FormatSection[]
}

export type FormatSection = {
  condition?: Condition
  color?: string
  parts: FormatPart[]

  scientific?: '+' | '-'
  percentCount?: number
  thousandSeparator?: boolean
  scale?: number

  // TODO: add dbNum support
  // dbNum?: string
}

export type Condition = {
  op: '>' | '<' | '>=' | '<=' | '<>' | '='
  value: number
}

export enum FormatPartKind {
  Digit, // #
  ZeroDigit, // 0
  SpaceDigit, // ?
  Percent,
  Literal,
  Dot,
}

export type FormatPart = {
  kind: FormatPartKind
  char?: string
}

export type PlaceholderPart = {}

export class Parser {
  constructor(readonly tokens: Token[]) {}

  parse(): FormatAST {
    const sections: FormatSection[] = []
    let section: FormatSection = {
      parts: [],
    }
    for (const [index, tk] of this.tokens.entries()) {
      const nextTk = this.tokens[index + 1]
      const prevTk = this.tokens[index - 1]
      switch (tk.type) {
        case 'Color':
          section.color = tk.name
          break
        case 'Condition':
          section.condition = {
            op: tk.op as Condition['op'],
            value: tk.value,
          }
          break
        case 'SectionSeparator':
          sections.push(section)
          section = {
            parts: [],
          }
          break
        case 'Dot':
          section.parts.push({
            kind: FormatPartKind.Dot,
          })
          break
        case 'ThousandSep':
          if (prevTk?.type === 'Placeholder') {
            if (nextTk?.type === 'Placeholder') {
              section.thousandSeparator = true
            } else if (
              !this.tokens
                .slice(index + 1)
                .some((tk) => tk.type === 'Placeholder') // there is no placeholder after the comma
            ) {
              section.scale = (section.scale ?? 1) * 1000
            }
          } else if (prevTk?.type === 'Literal') {
            section.parts.push({
              kind: FormatPartKind.Literal,
              char: ',',
            })
          } else {
            // should be ignored
          }
          break
        case 'Percent':
          section.percentCount = (section.percentCount ?? 0) + 1
          section.parts.push({
            kind: FormatPartKind.Percent,
          })
          break
        case 'ScientificSymbol':
          section.scientific = tk.sign
          break
        case 'Literal':
          section.parts.push({
            kind: FormatPartKind.Literal,
            char: tk.char,
          })
          break
        case 'Quoted':
          // Add each character from the quoted text as a literal
          for (const char of tk.text) {
            section.parts.push({
              kind: FormatPartKind.Literal,
              char,
            })
          }
          break
        case 'Placeholder':
          section.parts.push({
            kind: {
              '0': FormatPartKind.ZeroDigit,
              '#': FormatPartKind.Digit,
              '?': FormatPartKind.SpaceDigit,
            }[tk.char],
          })
          break
      }
    }
    if (section.parts.length > 0) {
      sections.push(section)
    }
    return { sections }
  }
}

export function parse(v: string) {
  return new Parser(new Tokenizer(v).tokenize()).parse()
}
