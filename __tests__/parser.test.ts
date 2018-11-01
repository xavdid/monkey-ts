import { Lexer } from '../src/lexer'
import { Parser } from '../src/parser'
import { Statement, LetStatement, Program, ReturnStatement } from '../src/ast'

function _testLetStatement(s: LetStatement, name: string) {
  expect(s.tokenLiteral()).toEqual('let')
  expect(s.statementNode()).toBeTruthy()
  expect(s.name.value).toEqual(name)
  expect(s.name.tokenLiteral()).toEqual(name)
}

function _raiseParserErrors(p: Parser) {
  if (p.errors.length) {
    fail(new Error(p.errors.join('\n')))
  }
}

describe('parser', () => {
  it('should parse let statements', () => {
    const input = `let x = 5;
    let y = 10;
    let foobar = 838383;
    `

    const l = new Lexer(input)
    const p = new Parser(l)

    const program = p.parseProgram()
    _raiseParserErrors(p)

    expect(program.statements.length).toEqual(3)

    const answers = ['x', 'y', 'foobar']
    answers.forEach((answer, i) => {
      const stmt = program.statements[i] as LetStatement
      _testLetStatement(stmt, answer)
    })
  })

  it('should parse return statements', () => {
    const input = `return 5;
    return 10;
    return 993322;
    `
    const l = new Lexer(input)
    const p = new Parser(l)

    const program = p.parseProgram()
    _raiseParserErrors(p)

    expect(program.statements.length).toEqual(3)

    program.statements.forEach((statement: ReturnStatement) => {
      expect(statement.tokenLiteral()).toEqual('return')
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
