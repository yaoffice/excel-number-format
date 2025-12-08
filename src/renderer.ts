/**
 * Renderer for Excel-like number format.
 *
 * Input: AST (Parser's output)
 * Output: Text rendered according to the format string
 */

import {
  Parser,
  type FormatAST,
  type FormatSection,
  type FormatPart,
  FormatPartKind,
} from './parser'
import { Tokenizer } from './tokenizer'

export type Value = string | number

export type RenderResult = {
  text: string
  color?: string
}

/**
 * Helper for render value in format
 */
export function render(value: Value, format: string): RenderResult {
  const tokens = new Tokenizer(format).tokenize()
  const ast = new Parser(tokens).parse()

  // Select the appropriate section based on value type
  const section = selectSection(ast, value)
  if (!section) {
    return { text: String(value) }
  }
  if (section.condition) {
    if (typeof value === 'number') {
      if (!evaluateCondition(section.condition, value)) {
        return { text: String(value) }
      }
    } else {
      return { text: String(value) }
    }
  }

  // Render based on section parts
  const text = renderSection(section, value)
  return {
    text,
    color: section.color,
  }
}

/**
 * Select the appropriate section based on value type
 * - 1 section: used for all
 * - 2 sections: first for positive/zero, second for negative
 * - 3 sections: first for positive, second for negative, third for zero
 * - 4 sections: positive, negative, zero, text
 *
 * IF conditon is present, return the section that matches the condition.
 */
function selectSection(ast: FormatAST, value: Value): FormatSection | null {
  const sections = ast.sections

  // Single section: used for all values
  if (sections.length === 1) {
    return sections[0]
  }

  // Check if any section has a condition
  const conditionalSections = sections.filter((s) => s.condition)
  if (conditionalSections.length > 0 && typeof value === 'number') {
    // Find the first section whose condition matches
    for (const section of conditionalSections) {
      if (section.condition && evaluateCondition(section.condition, value)) {
        return section
      }
    }
    // none conditions is matched, select the first non-condition section
    const nonConditionalSections = sections.filter((s) => !s.condition)
    if (nonConditionalSections.length > 0) {
      return nonConditionalSections[0]
    }
    return null
  }

  // For text values, use the 4th section if it exists (4-section format)
  if (typeof value === 'string') {
    if (sections.length === 4) {
      return sections[3]
    }
    // Otherwise use the first section for text
    return sections[0]
  }

  const numValue = value as number

  // 2 sections: positive/zero | negative
  if (sections.length === 2) {
    return numValue < 0 ? sections[1] : sections[0]
  }

  // 3 sections: positive | negative | zero
  if (sections.length === 3) {
    if (numValue > 0) return sections[0]
    if (numValue < 0) return sections[1]
    return sections[2]
  }

  // 4 sections: positive | negative | zero | text
  if (sections.length === 4) {
    if (numValue > 0) return sections[0]
    if (numValue < 0) return sections[1]
    return sections[2]
  }

  // Default to first section
  return sections[0]
}

/**
 * Evaluate condition
 */
function evaluateCondition(
  condition: { op: string; value: number },
  numValue: number,
): boolean {
  switch (condition.op) {
    case '>':
      return numValue > condition.value
    case '>=':
      return numValue >= condition.value
    case '<':
      return numValue < condition.value
    case '<=':
      return numValue <= condition.value
    case '=':
    case '==':
      return numValue === condition.value
    case '<>':
    case '!=':
      return numValue !== condition.value
    default:
      return true
  }
}

/**
 * Render a section with the given value
 */
function renderSection(section: FormatSection, value: Value): string {
  if (typeof value === 'string') {
    return formatTextSection(value, section)
  }

  let numValue = value as number
  const isNegative = numValue < 0
  numValue = Math.abs(numValue)

  // Apply percentage multiplier
  if (section.percentCount && section.percentCount > 0) {
    numValue = numValue * Math.pow(100, section.percentCount)
  }

  // Split the number into integer and decimal parts
  const numStr = String(numValue)
  const [integerStr, decimalStr = ''] = numStr.split('.')

  const dotIndex = section.parts.findIndex((p) => p.kind === FormatPartKind.Dot)
  const integerParts =
    dotIndex > -1 ? section.parts.slice(0, dotIndex) : section.parts
  const decimalParts = dotIndex > -1 ? section.parts.slice(dotIndex + 1) : []
  let formatedInt = formatIntegerPart(integerStr, section, integerParts)
  if (isNegative) {
    formatedInt = '-' + formatedInt
  }
  if (dotIndex === -1) {
    return formatedInt
  }
  const formatedDec = formatDecimalPart(decimalStr, section, decimalParts)
  return formatedInt + '.' + formatedDec
}

function formatTextSection(text: string, section: FormatSection): string {
  let result = ''
  for (const part of section.parts) {
    switch (part.kind) {
      case FormatPartKind.Literal:
        result += part.char
        break
      // case FormatPartKind.
    }
  }
  return result
}

/**
 * Format the integer part of a number
 */
function formatIntegerPart(
  integerStr: string,
  section: FormatSection,
  parts: FormatPart[],
): string {
  let digitIndex = integerStr.length - 1
  function nextInt(): string {
    return integerStr[digitIndex--]
  }
  function hasMoreInt(): boolean {
    return digitIndex >= 0
  }

  // Format the number based on format parts
  const result = []
  let digits = 0
  function pushDigit(c: string) {
    if (section.thousandSeparator) {
      if (digits > 0 && digits % 3 === 0) {
        result.push(',')
      }
    }
    digits++
    result.push(c)
  }

  const firstDigitIndex = parts.findIndex(
    (p) =>
      p.kind === FormatPartKind.Digit ||
      p.kind === FormatPartKind.ZeroDigit ||
      p.kind === FormatPartKind.SpaceDigit,
  )
  const lastDigitIndex =
    firstDigitIndex > -1 ? parts.length - firstDigitIndex - 1 : -1
  for (const [index, part] of parts.reverse().entries()) {
    switch (part.kind) {
      case FormatPartKind.ZeroDigit:
      case FormatPartKind.SpaceDigit:
      case FormatPartKind.Digit:
        {
          const digit = nextInt()
          if (digit === undefined) {
            if (part.kind === FormatPartKind.ZeroDigit) {
              pushDigit('0')
            } else if (part.kind === FormatPartKind.SpaceDigit) {
              result.push(' ')
            }
          } else {
            pushDigit(digit)
          }
          if (index === lastDigitIndex) {
            while (hasMoreInt()) {
              pushDigit(nextInt())
            }
          }
        }
        break
      case FormatPartKind.Literal:
        result.push(part.char)
        break
      case FormatPartKind.Percent:
        result.push('%')
        break
    }
  }
  return result.reverse().join('')
}

/**
 * Format the decimal part of a number
 */
function formatDecimalPart(
  decimalStr: string,
  section: FormatSection,
  parts: FormatPart[],
): string {
  let result = ''
  let digitIndex = 0

  function nextDigit() {
    return decimalStr[digitIndex++]
  }
  let digits = 0
  const lastPlaceholderIndex = parts.findLastIndex(
    (v) =>
      v.kind === FormatPartKind.Digit ||
      v.kind === FormatPartKind.ZeroDigit ||
      v.kind === FormatPartKind.SpaceDigit,
  )
  function pushDigit(c: string) {
    if (digits === lastPlaceholderIndex) {
      const next = decimalStr[digits + 1]
      if (next != undefined && next >= '5' && next <= '9') {
        c = String(Number(c) + 1)
      }
    }
    digits++
    result += c
  }

  for (const part of parts) {
    switch (part.kind) {
      case FormatPartKind.ZeroDigit:
        // '0' - always show digit, pad with 0 if needed
        pushDigit(nextDigit() || '0')
        break
      case FormatPartKind.Digit:
        // '#' - only show if digit exists and is not trailing zero
        const digit = nextDigit()
        if (digit !== undefined) {
          pushDigit(digit)
        }
        break
      case FormatPartKind.SpaceDigit:
        // '?' - show digit or space
        pushDigit(nextDigit() || ' ')
        break
      case FormatPartKind.Percent:
        result += '%'
        break
      case FormatPartKind.Literal:
        result += part.char
        break
    }
  }

  return result
}
