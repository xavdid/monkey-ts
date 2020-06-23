import { Lexer } from '../lexer'
import { Parser } from '../parser'

import { evaluate } from '../evaluator'
import { BaseNonNullObject } from '../object'

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
      expect((evalProgram(input) as BaseNonNullObject).value).toEqual(
        parseInt(input, 10)
      )
    })
  })
})
