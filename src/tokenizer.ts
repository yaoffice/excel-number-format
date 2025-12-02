export type Token =
  | {
      type: 'DateToken'
      token: string
    }
  | {
      type:
        | 'SectionSeparator'
        | 'DecimalPoint'
        | 'ThousandSep'
        | 'Percent'
        | 'TextPlaceholder'
    }
  | {
      type: 'Placeholder' | 'Literal' | 'Escape' | 'Fill' | 'Space'
      char: string
    }
  | {
      type: 'Color'
      name: string
    }
  | {
      type: 'ScientificSymbol'
      sign?: '+' | '-'
    }
  | {
      type: 'Quoted'
      text: string
    }
  | {
      type: 'Locale'
      raw: string
    }
  | {
      type: 'Condition'
      op: string
      value: number
    }

export class Tokenizer {
  private format: string
  private pos: number = 0
  private len: number

  constructor(format: string) {
    this.format = format
    this.len = format.length
  }

  tokenize(): Token[] {
    const tokens: Token[] = []

    while (!this.eof()) {
      const ch = this.peek()

      // 1. Section separator
      if (ch === ';') {
        tokens.push({ type: 'SectionSeparator' })
        this.next()
        continue
      }

      // 2. Quoted text
      if (ch === '"') {
        tokens.push(this.readQuoted())
        continue
      }

      // 3. Escape \x
      if (ch === '\\') {
        tokens.push(this.readEscape())
        continue
      }

      // 4. Fill *x
      if (ch === '*') {
        tokens.push(this.readFill())
        continue
      }

      // 5. Space _x
      if (ch === '_') {
        tokens.push(this.readSpace())
        continue
      }

      // 6. Bracket: color/condition/locale
      if (ch === '[') {
        tokens.push(this.readBracket())
        continue
      }

      // 7. Placeholders 0 # ?
      if (ch === '0' || ch === '#' || ch === '?') {
        tokens.push({ type: 'Placeholder', char: ch })
        this.next()
        continue
      }

      // 8. Decimal point
      if (ch === '.') {
        tokens.push({ type: 'DecimalPoint' })
        this.next()
        continue
      }

      // 9. Comma
      if (ch === ',') {
        tokens.push({ type: 'ThousandSep' })
        this.next()
        continue
      }

      // 10. Percent
      if (ch === '%') {
        tokens.push({ type: 'Percent' })
        this.next()
        continue
      }

      // 11. Scientific E+00 / e-00
      if (ch === 'E' || ch === 'e') {
        const sci = this.tryScientific()
        if (sci) {
          tokens.push(sci)
          continue
        }
        // otherwise literal
      }

      // 12. Text placeholder @
      if (ch === '@') {
        tokens.push({ type: 'TextPlaceholder' })
        this.next()
        continue
      }

      // 13. Date tokens (longest match)
      const dateToken = this.tryDateToken()
      if (dateToken) {
        tokens.push(dateToken)
        continue
      }

      // 14. Default literal
      tokens.push({ type: 'Literal', char: ch })
      this.next()
    }

    return tokens
  }

  // ========== Helper functions ==========

  private peek(n = 0): string {
    return this.format[this.pos + n]
  }

  private next(): string {
    return this.format[this.pos++]
  }

  private eof(): boolean {
    return this.pos >= this.len
  }

  // --- [Quoted string] ---------------------
  private readQuoted(): Token {
    this.next() // consume first "

    let text = ''
    while (!this.eof()) {
      const ch = this.next()

      if (ch === '"') {
        if (this.peek() === '"') {
          // Escaped double quote: ""
          this.next()
          text += '"'
          continue
        }
        break // end quoted
      }
      text += ch
    }
    return { type: 'Quoted', text }
  }

  // --- [Escape \x] -------------------------
  private readEscape(): Token {
    this.next() // consume '\'
    const ch = this.next() ?? ''
    return { type: 'Escape', char: ch }
  }

  // --- [Fill *x] ---------------------------
  private readFill(): Token {
    this.next() // consume '*'
    const ch = this.next() ?? ''
    return { type: 'Fill', char: ch }
  }

  // --- [Space _x] --------------------------
  private readSpace(): Token {
    this.next() // consume '_'
    const ch = this.next() ?? ''
    return { type: 'Space', char: ch }
  }

  // --- [Bracket tokens: color / condition / locale] ----
  private readBracket(): Token {
    this.next() // consume '['
    let content = ''
    while (!this.eof() && this.peek() !== ']') {
      content += this.next()
    }
    this.next() // consume ']'

    // Condition: [>10], [<=5]
    const condMatch = content.match(/^(<=|>=|<>|<|>|=)(-?\d+(\.\d+)?)$/)
    if (condMatch) {
      return {
        type: 'Condition',
        op: condMatch[1],
        value: Number(condMatch[2])
      }
    }

    // Color
    const colors = [
      'Black',
      'Blue',
      'Cyan',
      'Green',
      'Magenta',
      'Red',
      'White',
      'Yellow'
    ]
    if (colors.includes(content)) {
      return { type: 'Color', name: content }
    }

    // Otherwise treat as locale/other
    return { type: 'Locale', raw: content }
  }

  // --- Scientific lookahead ----------------
  private tryScientific(): Token | null {
    const ch = this.peek()
    const sign = this.peek(1)
    // const d1 = this.peek(2)
    // const d2 = this.peek(3)

    if (
      (ch === 'E' || ch === 'e') &&
      (sign === '+' || sign === '-')
      // &&
      // /\d/.test(d1) &&
      // /\d/.test(d2)
    ) {
      this.pos += 2 // consume E+00
      return {
        type: 'ScientificSymbol',
        sign: sign as '+' | '-'
      }
    }
    return null
  }

  // --- Date tokens (longest match) ---------
  private tryDateToken(): Token | null {
    const patterns = [
      'yyyy',
      'yyy',
      'yy',
      'y',
      'mmmmm',
      'mmmm',
      'mmm',
      'mm',
      'm',
      'dddd',
      'ddd',
      'dd',
      'd',
      'hh',
      'h',
      'ss',
      's',
      'AM/PM',
      'am/pm'
    ]

    for (const p of patterns) {
      if (this.format.startsWith(p, this.pos)) {
        this.pos += p.length
        return { type: 'DateToken', token: p }
      }
    }
    return null
  }
}
