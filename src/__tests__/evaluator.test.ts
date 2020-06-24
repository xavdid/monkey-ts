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
    const tests = ['10', '5', '-5', '-10']

    tests.forEach((input) => {
      expect(evalProgram(input).value).toEqual(parseInt(input, 10))
    })
  })

  it('should evaluate boolean expressions', () => {
    const tests = [true, false]

    tests.forEach((input) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      expect(evalProgram(`${input}`).value).toEqual(input)
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
})
