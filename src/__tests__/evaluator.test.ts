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
  it('should eval integer expressions', () => {
    const tests = ['10', '5']

    tests.forEach((input) => {
      expect(evalProgram(input).value).toEqual(parseInt(input, 10))
    })
  })

  it('should eval boolean expressions', () => {
    const tests = [true, false]

    tests.forEach((input) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      expect(evalProgram(`${input}`).value).toEqual(input)
    })
  })
})
