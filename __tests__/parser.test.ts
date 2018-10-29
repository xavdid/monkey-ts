import { Lexer } from '../src/lexer'
import { Parser } from '../src/parser'
import { Statement, LetStatement } from '../src/ast'

function _testLetStatement(s: LetStatement, name: string) {
  expect(s.tokenLiteral()).toEqual('let')
  expect(s.statementNode()).toBeTruthy()
  expect(s.name.value).toEqual(name)
  expect(s.name.tokenLiteral()).toEqual(name)
}

describe('parser', () => {
  it('should parse a simple file', () => {
    const input = `let x = 5;
    let y = 10;
    let foobar = 838383;
    `

    const l = new Lexer(input)
    const p = new Parser(l)

    const program = p.parseProgram()
    expect(p.errors.length).toEqual(0)
    if (!program) {
      fail(new Error('parseProgram returned undefined'))
    }

    expect(program.statements.length).toEqual(3)

    const answers = ['x', 'y', 'foobar']
    answers.forEach((answer, i) => {
      const stmt = program.statements[i] as LetStatement
      _testLetStatement(stmt, answer)
    })
  })

  it('should have parse errors', () => {
    const input = `let x  5;
    let  = 10;
    let 838383;
    `

    const l = new Lexer(input)
    const p = new Parser(l)

    p.parseProgram()
    expect(p.errors.length).toEqual(3)
  })
})
