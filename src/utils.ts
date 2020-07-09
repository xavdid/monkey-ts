/**
 * converts a number to a char
 */
export const numToString = (num: number) => {
  return String.fromCharCode(num)
}

/**
 * converts a char to its number code. Returns the code for the first character if string length is > 1
 */
export const stringToNum = (s: string) => {
  return s.charCodeAt(0)
}

// `_read` filters

/**
 * takes a char code and decides if it's a letter
 * @param ch char code
 */
export const isLetter = (ch: number): boolean => {
  // expand this to add whether or not ? and ! can be part of identifiers
  return (
    (stringToNum('a') <= ch && ch <= stringToNum('z')) ||
    (stringToNum('A') <= ch && ch <= stringToNum('Z')) ||
    ch === stringToNum('_')
  )
}

export const isDigit = (ch: number): boolean =>
  stringToNum('0') <= ch && ch <= stringToNum('9')

export const notDoubleQuote = (ch: number): boolean =>
  ch !== stringToNum('"') && ch !== 0
