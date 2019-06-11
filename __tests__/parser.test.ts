import { Lexer } from '../src/lexer'
import { Parser } from '../src/parser'
import {
  LetStatement,
  ReturnStatement,
  ExpressionStatement,
  Identifier,
  IntegerLiteral,
  PrefixExpression,
  Expression
} from '../src/ast'

const _testLetStatement = (s: LetStatement, name: string) => {
  expect(s.tokenLiteral()).toEqual('let')
  expect(s.statementNode()).toBeTruthy()
  expect(s.name.value).toEqual(name)
  expect(s.name.tokenLiteral()).toEqual(name)
}

const _testIntegerLiteral = (il: IntegerLiteral, value: number) => {
  expect(il.value).toEqual(value)
  expect(il.tokenLiteral()).toEqual(String(value))
}

const _raiseParserErrors = (p: Parser) => {
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
    expect(p.errors.length).toEqual(4) // originally was 3, but bad parsing causes the "no function" error to be there?
  })

  it('should parse identifiers', () => {
    const input = 'foobar;'
    const l = new Lexer(input)

    const p = new Parser(l)
    const program = p.parseProgram()
    _raiseParserErrors(p)

    expect(program.statements.length).toEqual(1)
    const stmt = program.statements[0] as ExpressionStatement
    const ident = stmt.expression as Identifier
    expect(ident.value).toEqual('foobar')
    expect(ident.tokenLiteral()).toEqual('foobar')
  })

  it('should parse integers', () => {
    const input = '5;'
    const l = new Lexer(input)

    const p = new Parser(l)
    const program = p.parseProgram()
    _raiseParserErrors(p)

    expect(program.statements.length).toEqual(1)
    const stmt = program.statements[0] as ExpressionStatement
    const ident = stmt.expression as IntegerLiteral
    expect(ident.value).toEqual(5)
    expect(ident.tokenLiteral()).toEqual('5')
  })

  it('should parse prefix expressions', () => {
    const tests = [
      {
        input: '!5;',
        operator: '!',
        integerValue: 5
      },
      {
        input: '-15;',
        operator: '-',
        integerValue: 15
      }
    ]

    tests.forEach(test => {
      const l = new Lexer(test.input)
      const p = new Parser(l)
      const program = p.parseProgram()
      _raiseParserErrors(p)

      expect(program.statements.length).toEqual(1)
      const stmt = program.statements[0] as ExpressionStatement
      const exp = stmt.expression as PrefixExpression

      expect(exp.operator).toEqual(test.operator)

      _testIntegerLiteral(exp.right as IntegerLiteral, test.integerValue)
    })
  })
})
// })ryan is great!!!!!!
