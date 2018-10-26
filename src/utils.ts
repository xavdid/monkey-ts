/**
 * takes a char code and decides if it's a letter
 * @param ch char code
 */
export function isLetter(ch: number) {
  // expand this to add whether or not ? and ! can be part of identifiers
  return (
    (stringToNum('a') <= ch && ch <= stringToNum('z')) ||
    (stringToNum('A') <= ch && ch <= stringToNum('Z')) ||
    ch === stringToNum('_')
  )
}

export function isDigit(ch: number) {
  return stringToNum('0') <= ch && ch <= stringToNum('9')
}

export function numToString(num: number) {
  return String.fromCharCode(num)
}

export function stringToNum(s: string) {
  return s.charCodeAt(0)
}
