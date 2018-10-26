import { isLetter, isDigit, stringToNum } from '../src/utils'

describe('utils', () => {
  it('should identify letters', () => {
    expect(isLetter(stringToNum('a'))).toEqual(true)
    expect(isLetter(stringToNum('z'))).toEqual(true)
    expect(isLetter(stringToNum('A'))).toEqual(true)
    expect(isLetter(stringToNum('Z'))).toEqual(true)
    expect(isLetter(stringToNum('m'))).toEqual(true)
    expect(isLetter(stringToNum('M'))).toEqual(true)
    expect(isLetter(stringToNum('_'))).toEqual(true)

    // these may change
    expect(isLetter(stringToNum('!'))).toEqual(false)
    expect(isLetter(stringToNum('?'))).toEqual(false)

    expect(isLetter(stringToNum('1'))).toEqual(false)
    expect(isLetter(stringToNum('0'))).toEqual(false)
    expect(isLetter(stringToNum(';'))).toEqual(false)
    expect(isLetter(stringToNum('/'))).toEqual(false)
    expect(isLetter(stringToNum('{'))).toEqual(false)
  })

  it('should identify digits', () => {
    expect(isDigit(stringToNum('1'))).toEqual(true)
    expect(isDigit(stringToNum('0'))).toEqual(true)
    expect(isDigit(stringToNum('9'))).toEqual(true)
    expect(isDigit(stringToNum('5'))).toEqual(true)
    expect(isDigit(stringToNum('a'))).toEqual(false)
    expect(isDigit(stringToNum('D'))).toEqual(false)
    expect(isDigit(stringToNum('Z'))).toEqual(false)
    expect(isDigit(stringToNum('R'))).toEqual(false)
    expect(isDigit(stringToNum('r'))).toEqual(false)
    expect(isDigit(stringToNum('y'))).toEqual(false)
    expect(isDigit(stringToNum('_'))).toEqual(false)
    expect(isDigit(stringToNum(';'))).toEqual(false)
    expect(isDigit(stringToNum('/'))).toEqual(false)
    expect(isDigit(stringToNum('{'))).toEqual(false)
  })
})
