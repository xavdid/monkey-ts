import { Token, TOKENS } from '../token'
import { LetStatement, Identifier, Program } from '../ast'

describe('ast', () => {
  it('should print a program', () => {
    const ls = new LetStatement(
      new Token(TOKENS.LET, 'let'),
      new Identifier(new Token(TOKENS.IDENT, 'myVar'), 'myVar'),
      new Identifier(new Token(TOKENS.IDENT, 'anotherVar'), 'anotherVar')
    )

    const p = new Program()
    p.statements = [ls]
    expect(p.toString()).toEqual('let myVar = anotherVar;')
  })
})
