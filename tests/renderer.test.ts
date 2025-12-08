import { describe, expect, it } from 'vitest'
import { render } from '../src/renderer'

describe('integer', () => {
  it('simple cases', () => {
    expect(render(123, '0000')).toEqual({ text: '0123' })
    expect(render(123, '#')).toEqual({ text: '123' })
    expect(render(123, '#####')).toEqual({ text: '123' })
    expect(render(123, '?000')).toEqual({ text: ' 123' })
  })
  it('with literal', () => {
    expect(render(123, '#ok#ok#')).toEqual({ text: '1ok2ok3' })
    expect(render(123, '0#ok#ok#')).toEqual({ text: '01ok2ok3' })
    expect(render(0, '0')).toEqual({ text: '0' })
    expect(render(0, '#')).toEqual({ text: '0' }) // '#' at least shows 0 for 0
    expect(render(0, '?')).toEqual({ text: '0' }) // '?' shows space for zero
    expect(render(12, '000')).toEqual({ text: '012' })
    expect(render(3, '00')).toEqual({ text: '03' })
    expect(render(-3, '00')).toEqual({ text: '-03' })
    expect(render(45, '???')).toEqual({ text: ' 45' })
    expect(render(-45, '???')).toEqual({ text: '- 45' })
    expect(render(7, '#0#')).toEqual({ text: '07' })
    expect(render(14, '#ok#')).toEqual({ text: '1ok4' })
    expect(render(-8, '0')).toEqual({ text: '-8' })
    expect(render(-123, '000')).toEqual({ text: '-123' })
    expect(render(1, '"x"#')).toEqual({ text: 'x1' })
    expect(render(10, '#" cats"')).toEqual({ text: '10 cats' })
    expect(render(0, '"zero"')).toEqual({ text: 'zero' })
  })
  it('percent', () => {
    expect(render(123, '#%')).toEqual({ text: '12300%' })
    expect(render(0, '0000')).toEqual({ text: '0000' })
    expect(render(42, '000')).toEqual({ text: '042' })
    expect(render(7, '#')).toEqual({ text: '7' })
    expect(render(1234, '0,0')).toEqual({ text: '1,234' }) // Note: thousands separator
    expect(render(0, '#')).toEqual({ text: '0' })
    expect(render(-123, '0000')).toEqual({ text: '-0123' })
    expect(render(-8, '###')).toEqual({ text: '-8' })
    expect(render(12, '?"ok"00')).toEqual({ text: ' ok12' })
    expect(render(5, '?0?')).toEqual({ text: ' 05' })
    expect(render(-56, '?0?')).toEqual({ text: '- 56' })
    // percent cases
    expect(render(1, '0%')).toEqual({ text: '100%' })
    expect(render(0.12, '0%')).toEqual({ text: '12%' })
    expect(render(0, '0%')).toEqual({ text: '0%' })
    expect(render(-1, '0%')).toEqual({ text: '-100%' })
  })
  it('thousands separator', () => {
    expect(render(1234567890, '0,000')).toEqual({ text: '1,234,567,890' })
    expect(render(1234567890, '0,000')).toEqual({ text: '1,234,567,890' })
    expect(render(1234567890, '0,000%')).toEqual({
      text: '123,456,789,000%',
    })
    expect(render(123, '0ok,')).toEqual({ text: '123ok,' }) // treated as literal here
  })
})

describe('decimal', () => {
  it('simple decimal', () => {
    expect(render(123.456, '0.00')).toEqual({ text: '123.46' })
    expect(render(123.456, '0.000')).toEqual({ text: '123.456' })
    expect(render(123.456, '0.0000')).toEqual({ text: '123.4560' })
    expect(render(123.456, '0.00??')).toEqual({ text: '123.456 ' })
    expect(render(123.456, '0.####')).toEqual({ text: '123.456' })
    expect(render(123.456, '0.##')).toEqual({ text: '123.46' })
    expect(render(123.456, '0.#')).toEqual({ text: '123.5' })
    expect(render(-123.456, '0.#')).toEqual({ text: '-123.5' })
  })
  it('thousands separator', () => {
    expect(render(1234.56, '0,0.00')).toEqual({ text: '1,234.56' })
  })
})

describe('color', () => {
  it('simple color', () => {
    expect(render(123, '[Red]0')).toEqual({ text: '123', color: 'Red' })
    expect(render(123, '[Blue]0')).toEqual({ text: '123', color: 'Blue' })
    expect(render(123, '[Green]0')).toEqual({ text: '123', color: 'Green' })
    expect(render(123, '[Yellow]0')).toEqual({ text: '123', color: 'Yellow' })
    expect(render(123, '[Black]0')).toEqual({ text: '123', color: 'Black' })
    expect(render(123, '[White]0')).toEqual({ text: '123', color: 'White' })
  })
})

describe('condition', () => {
  it('simple condition', () => {
    expect(render(123, '[>100]0')).toEqual({ text: '123' })
    expect(render(123, '[<=100]0')).toEqual({ text: '123' })
    expect(render(123, '[<100]0')).toEqual({ text: '123' })
    expect(render(123, '[>=100]0')).toEqual({ text: '123' })
    expect(render(123, '[<>100]0')).toEqual({ text: '123' })
  })

  it('text selection', () => {
    // Four sections: text in 4th section
    expect(render('hello', '0;0;0;"text section"')).toEqual({
      text: 'text section',
    })
    // Non selection matched, should fallback to general format
    expect(render('x', '[>100]0;"text!"')).toEqual({
      text: 'x',
    })
  })

  it('multiple sections', () => {
    expect(render(123, '[>100][Red]0;[<=100][Blue]0')).toEqual({
      text: '123',
      color: 'Red',
    })
    // Multiple sections: first with condition, second fallback
    expect(render(90, '[>100][Red]0;[<=100][Blue]0')).toEqual({
      text: '90',
      color: 'Blue',
    })
    // Multiple sections: third as fallback
    expect(render(0, '[>100][Red]0;[<0][Blue]0;[=0][Green]0')).toEqual({
      text: '0',
      color: 'Green',
    })
    // Multiple sections: value does not match any condition, fallback to general
    expect(render(50, '[>100][Red]0;[<0][Blue]0;0')).toEqual({
      text: '50',
    })
    // Section with text after condition
    expect(render(150, '[>100]"Big:" 0;"Small:" 0')).toEqual({
      text: 'Big: 150',
    })
    expect(render(99, '[>100]"Big:" 0;"Small:" 0')).toEqual({
      text: 'Small: 99',
    })
    // Four sections with color in text section
    expect(render('abc', '0;0;0;[Red]"abc"')).toEqual({
      text: 'abc',
      color: 'Red',
    })
    // Condition on negative number
    expect(render(-123, '[<0][Red]0;0')).toEqual({
      text: '-123',
      color: 'Red',
    })
    // Multiple conditions, choose first match
    expect(render(50, '[>100][Red]0;[>10][Blue]0;0')).toEqual({
      text: '50',
      color: 'Blue',
    })
    expect(render('abc', '[>100]0')).toEqual({
      text: 'abc',
    })
  })
})
