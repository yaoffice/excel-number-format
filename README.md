# Excel Number Format

> A modern, lightweight TypeScript library for parsing and rendering Excel-style number formats

[![CI](https://github.com/linkduan/excel-number-format/workflows/CI/badge.svg)](https://github.com/linkduan/excel-number-format/actions)
[![npm version](https://img.shields.io/npm/v/excel-number-format.svg)](https://www.npmjs.com/package/excel-number-format)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Zero Dependencies** - Lightweight and fast
- 📊 **Excel Compatible** - Supports Excel number format syntax
- 🎨 **Color Support** - Renders colors like `[Red]`, `[Blue]`, etc.
- 🔢 **Comprehensive Formatting** - Integers, decimals, percentages, thousands separators
- ⚡ **TypeScript First** - Full type safety with TypeScript
- 🧪 **Well Tested** - Extensive test coverage
- 🚀 **Modern ESM** - ES Module support

## 📦 Installation

```bash
# npm
npm install excel-number-format

# pnpm
pnpm add excel-number-format

# yarn
yarn add excel-number-format
```

## 🚀 Quick Start

```typescript
import { render } from 'excel-number-format'

// Basic number formatting
render(123, '0000')
// => { text: '0123' }

// Decimals with rounding
render(123.456, '0.00')
// => { text: '123.46' }

// Thousands separator
render(1234567, '0,000')
// => { text: '1,234,567' }

// Percentage
render(0.12, '0%')
// => { text: '12%' }

// Colors
render(123, '[Red]0')
// => { text: '123', color: 'Red' }

// Conditional formatting
render(150, '[>100]"Big:" 0;"Small:" 0')
// => { text: 'Big: 150' }
```

## 📖 Usage Examples

### Basic Number Formatting

```typescript
import { render } from 'excel-number-format'

// Digit placeholders
render(123, '#')        // => { text: '123' }
render(123, '#####')    // => { text: '123' }
render(123, '0000')     // => { text: '0123' }
render(123, '?000')     // => { text: ' 123' }

// Negative numbers
render(-123, '000')     // => { text: '-123' }
render(-8, '0')         // => { text: '-8' }
```

**Digit Placeholders:**
- `#` - Shows digit only if significant
- `0` - Always shows digit (pads with zeros)
- `?` - Shows digit or space for alignment

### Decimal Formatting

```typescript
// Decimal places
render(123.456, '0.00')      // => { text: '123.46' }
render(123.456, '0.000')     // => { text: '123.456' }
render(123.456, '0.0000')    // => { text: '123.4560' }

// Optional decimals
render(123.456, '0.####')    // => { text: '123.456' }
render(123.456, '0.##')      // => { text: '123.46' }

// Decimal with alignment
render(123.456, '0.00??')    // => { text: '123.456 ' }
```

### Thousands Separator

```typescript
render(1234, '0,0')                    // => { text: '1,234' }
render(1234567890, '0,000')            // => { text: '1,234,567,890' }
render(1234.56, '0,0.00')              // => { text: '1,234.56' }
render(1234567890, '0,000%')           // => { text: '123,456,789,000%' }
```

### Percentage

```typescript
render(1, '0%')        // => { text: '100%' }
render(0.12, '0%')     // => { text: '12%' }
render(0.456, '0.0%')  // => { text: '45.6%' }
```

### Literal Text

```typescript
// Quoted literals
render(10, '"x"#')                 // => { text: 'x10' }
render(10, '#" cats"')             // => { text: '10 cats' }
render(0, '"zero"')                // => { text: 'zero' }

// Unquoted literals (outside digit placeholders)
render(14, '#ok#')                 // => { text: '1ok4' }
render(123, '#ok#ok#')             // => { text: '1ok2ok3' }
```

### Color Formatting

```typescript
render(123, '[Red]0')      // => { text: '123', color: 'Red' }
render(123, '[Blue]0')     // => { text: '123', color: 'Blue' }
render(123, '[Green]0')    // => { text: '123', color: 'Green' }
render(123, '[Yellow]0')   // => { text: '123', color: 'Yellow' }
render(123, '[Black]0')    // => { text: '123', color: 'Black' }
render(123, '[White]0')    // => { text: '123', color: 'White' }
```

**Supported Colors:** Red, Blue, Green, Yellow, Black, White, Cyan, Magenta

### Conditional Formatting

```typescript
// Simple conditions
render(123, '[>100]0')     // => { text: '123' } (condition met)
render(99, '[>100]0')      // => { text: '99' } (uses general format)

// Multiple sections with conditions
render(150, '[>100][Red]0;[<=100][Blue]0')
// => { text: '150', color: 'Red' }

render(90, '[>100][Red]0;[<=100][Blue]0')
// => { text: '90', color: 'Blue' }

// Conditions with text
render(150, '[>100]"Big:" 0;"Small:" 0')
// => { text: 'Big: 150' }

render(99, '[>100]"Big:" 0;"Small:" 0')
// => { text: 'Small: 99' }
```

**Condition Operators:**
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `=` - Equal
- `<>` - Not equal

### Multiple Sections

Excel format strings can have up to **four sections** separated by semicolons:

```
[Positive];[Negative];[Zero];[Text]
```

```typescript
// Two sections: positive/zero; negative
render(123, '0;[Red]-0')      // => { text: '123' }
render(-123, '0;[Red]-0')     // => { text: '-123', color: 'Red' }

// Three sections: positive; negative; zero
render(100, '0;[Red]-0;[Blue]"Zero"')   // => { text: '100' }
render(-100, '0;[Red]-0;[Blue]"Zero"')  // => { text: '-100', color: 'Red' }
render(0, '0;[Red]-0;[Blue]"Zero"')     // => { text: 'Zero', color: 'Blue' }

// Four sections: includes text handling
render('hello', '0;0;0;"text section"')
// => { text: 'text section' }
```

**Section Rules:**
- **1 section**: Applied to all numbers and text
- **2 sections**: Positive/zero use first; negative uses second
- **3 sections**: Positive, negative, zero respectively
- **4 sections**: Positive, negative, zero, text respectively

## 🎯 API Reference

### `render(value, format)`

Renders a value according to the Excel format string.

**Parameters:**
- `value: string | number` - The value to format
- `format: string` - The Excel format string

**Returns:** `RenderResult`
```typescript
type RenderResult = {
  text: string      // The formatted text
  color?: string    // Optional color (e.g., 'Red', 'Blue')
}
```

**Example:**
```typescript
const result = render(123.456, '[Red]0.00')
console.log(result.text)   // '123.46'
console.log(result.color)  // 'Red'
```

## 🔧 Excel Format Syntax Reference

### Digit Placeholders

| Symbol | Description | Example | Input | Output |
|--------|-------------|---------|-------|--------|
| `0` | Zero placeholder - shows zero if no digit | `000` | `12` | `012` |
| `#` | Digit placeholder - omits insignificant zeros | `###` | `12` | `12` |
| `?` | Space placeholder - adds space if no digit | `???` | `12` | ` 12` |

### Special Characters

| Symbol | Description | Example | Input | Output |
|--------|-------------|---------|-------|--------|
| `.` | Decimal point | `0.00` | `1.5` | `1.50` |
| `,` | Thousands separator | `0,000` | `1234` | `1,234` |
| `%` | Percentage (multiplies by 100) | `0%` | `0.5` | `50%` |
| `"text"` | Literal text | `"$"0.00` | `5` | `$5.00` |
| `[Color]` | Text color | `[Red]0` | `10` | `10` (red) |
| `[Condition]` | Conditional format | `[>100]0` | `150` | `150` |
| `;` | Section separator | `0;-0;"Zero"` | Various | - |

### Format Sections

```
[Condition][Color]Format;[Condition][Color]Format;...
```

- Up to 4 sections: Positive; Negative; Zero; Text
- Conditions: `[>100]`, `[<0]`, `[=0]`, `[>=50]`, `[<=100]`, `[<>0]`
- Colors: `[Red]`, `[Blue]`, `[Green]`, `[Yellow]`, `[Black]`, `[White]`, `[Cyan]`, `[Magenta]`

## 🛠️ Development

### Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Type check
pnpm typecheck

# Build
pnpm build

# Dev mode (watch and rebuild)
pnpm dev
```

### Architecture

The library uses a three-stage pipeline:

1. **Tokenizer** - Breaks format string into tokens
2. **Parser** - Builds Abstract Syntax Tree (AST) from tokens
3. **Renderer** - Renders values according to AST

```
Format String → Tokenizer → Tokens → Parser → AST → Renderer → Result
```

## 🧪 Testing

The library includes comprehensive tests covering:
- Integer formatting
- Decimal formatting
- Percentage formatting
- Thousands separators
- Color formatting
- Conditional formatting
- Multiple sections
- Edge cases

Run tests with:
```bash
pnpm test
```

## 📝 License

MIT © [Link Duan](https://github.com/linkduan)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

This library implements the Excel number format specification following the standards documented in the [Office Open XML specification](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/e5444c69-2e75-4c82-963b-a2d7b4e0f62f).

## 📚 Related Projects

- [numfmt](https://www.npmjs.com/package/numfmt) - Number format strings parser

---

<div align="center">
Made with ❤️ by the community
</div>
