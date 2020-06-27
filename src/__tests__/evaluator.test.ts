import { Lexer } from '../lexer'
import { Parser } from '../parser'

import { evaluate } from '../evaluator'

const evalProgram = (input: string) => {
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  return evaluate(program)
}

describe('evaulator', () => {
  it('should evaluate integer expressions', () => {
    const tests: Array<[string, number]> = [
      ['10', 10],
      ['5', 5],
      ['-5', -5],
      ['-10', -10],
      ['5 + 5 + 5 + 5 - 10', 10],
      ['2 * 2 * 2 * 2 * 2', 32],
      ['-50 + 100 + -50', 0],
      ['5 * 2 + 10', 20],
      ['5 + 2 * 10', 25],
      ['20 + 2 * -10', 0],
      ['50 / 2 * 2 + 10', 60],
      ['2 * (5 + 10)', 30],
      ['3 * 3 * 3 + 10', 37],
      ['3 * (3 * 3) + 10', 37],
      ['(5 + 10 * 2 + 15 / 3) * 2 + -10', 50],
    ]

    tests.forEach(([input, expected]) => {
      expect(evalProgram(input).value).toEqual(expected)
    })
  })

  it('should evaluate boolean expressions', () => {
    const tests: Array<[string, boolean]> = [
      ['true', true],
      ['false', false],
      ['1 < 2', true],
      ['1 > 2', false],
      ['1 < 1', false],
      ['1 > 1', false],
      ['1 == 1', true],
      ['1 != 1', false],
      ['1 == 2', false],
      ['1 != 2', true],
      ['true == true', true],
      ['false == false', true],
      ['true == false', false],
      ['true != false', true],
      ['false != true', true],
      ['(1 < 2) == true', true],
      ['(1 < 2) == false', false],
      ['(1 > 2) == true', false],
      ['(1 > 2) == false', true],
    ]

    tests.forEach(([input, expected]) => {
      try {
        expect(evalProgram(input).value).toEqual(expected)
      } catch (e) {
        console.log('The following input failed:', input)
        throw e
      }
    })
  })

  it('should evaluate !prefix expressions', () => {
    const tests: Array<[string, boolean]> = [
      ['!true', false],
      ['!false', true],
      ['!5', false],
      ['!!true', true],
      ['!!false', false],
      ['!!5', true],
    ]

    tests.forEach(([input, expected]) => {
      expect(evalProgram(input).value).toEqual(expected)
    })
  })

  it('should evaluate if expressions', () => {
    const tests: Array<[string, number | null]> = [
      ['if (true) { 10 }', 10],
      ['if (false) { 10 }', null],
      ['if (1) { 10 }', 10],
      ['if (1 < 2) { 10 }', 10],
      ['if (1 > 2) { 10 }', null],
      ['if (1 > 2) { 10 } else { 20 }', 20],
      ['if (1 < 2) { 10 } else { 20 }', 10],
    ]

    tests.forEach(([input, expected]) => {
      expect(evalProgram(input).value).toEqual(expected)
    })
  })
})
