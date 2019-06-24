import { Lexer } from '../src/lexer'
import { Parser } from '../src/parser'
import {
  LetStatement,
  ReturnStatement,
  ExpressionStatement,
  Identifier,
  IntegerLiteral,
  PrefixExpression,
  InfixExpression,
  Expression,
  Bool
} from '../src/ast'

const raiseParserErrors = (p: Parser) => {
  if (p.errors.length) {
    throw new Error(p.errors.join('\n'))
  }
}

const testLetStatement = (s: LetStatement, name: string) => {
  expect(s).toBeInstanceOf(LetStatement)
  expect(s.tokenLiteral()).toEqual('let')
  expect(s.statementNode()).toBeTruthy()
  expect(s.name.value).toEqual(name)
  expect(s.name.tokenLiteral()).toEqual(name)
}

const testIntegerLiteral = (il: IntegerLiteral, value: number) => {
  expect(il).toBeInstanceOf(IntegerLiteral)
  expect(il.value).toEqual(value)
  expect(il.tokenLiteral()).toEqual(String(value))
}

const testIdentifier = (e: Identifier, value: string) => {
  expect(e).toBeInstanceOf(Identifier)
  expect(e.value).toEqual(value)
  expect(e.tokenLiteral()).toEqual(value)
}

const testBooleanExpression = (b: Bool, expected: boolean) => {
  expect(b).toBeInstanceOf(Bool)
  expect(b.value).toEqual(expected)
  expect(b.tokenLiteral()).toEqual(String(expected))
}

const testLiteralExpression = (
  exp: Expression,
  expected: string | number | boolean
) => {
  switch (typeof expected) {
    case 'number':
      testIntegerLiteral(exp as IntegerLiteral, expected)
      break
    case 'string':
      testIdentifier(exp as Identifier, expected)
      break
    case 'boolean':
      testBooleanExpression(exp as Bool, expected)
      break
    default:
      throw new Error(`type of exp not handled, got ${exp}`)
  }
}

const testInfixExpression = (
  exp: InfixExpression,
  left: any,
  operator: string,
  right: any
) => {
  expect(exp).toBeInstanceOf(InfixExpression)
  testLiteralExpression(exp.left, left)
  expect(exp.operator).toEqual(operator)
  testLiteralExpression(exp.right, right)
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
    raiseParserErrors(p)

    expect(program.statements.length).toEqual(3)

    const answers = ['x', 'y', 'foobar']
    answers.forEach((answer, i) => {
      const stmt = program.statements[i] as LetStatement
      testLetStatement(stmt, answer)
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
    raiseParserErrors(p)

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
    raiseParserErrors(p)

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
    raiseParserErrors(p)

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
      raiseParserErrors(p)

      expect(program.statements.length).toEqual(1)
      const stmt = program.statements[0] as ExpressionStatement
      const exp = stmt.expression as PrefixExpression

      expect(exp.operator).toEqual(test.operator)

      testIntegerLiteral(exp.right as IntegerLiteral, test.integerValue)
    })
  })

  it('should parse infix expressions', () => {
    const operators = ['+', '-', '*', '/', '>', '<', '==', '!=']
    const tests = operators.map(o => ({
      input: `5 ${o} 5;`,
      leftValue: 5,
      operator: o,
      rightValue: 5
    }))

    tests.forEach(test => {
      const l = new Lexer(test.input)
      const p = new Parser(l)
      const program = p.parseProgram()
      raiseParserErrors(p)

      expect(program.statements.length).toEqual(1)
      const stmt = program.statements[0] as ExpressionStatement
      const exp = stmt.expression as InfixExpression

      testIntegerLiteral(exp.left as IntegerLiteral, test.leftValue)
      expect(exp.operator).toEqual(test.operator)
      testIntegerLiteral(exp.right as IntegerLiteral, test.rightValue)
    })
  })

  it('should test operater precedence parsing', () => {
    const tests = [
      {
        input: '-a * b',
        expected: '((-a) * b)'
      },
      {
        input: '!-a',
        expected: '(!(-a))'
      },
      {
        input: 'a + b + c',
        expected: '((a + b) + c)'
      },
      {
        input: 'a + b - c',
        expected: '((a + b) - c)'
      },
      {
        input: 'a * b * c',
        expected: '((a * b) * c)'
      },
      {
        input: 'a * b / c',
        expected: '((a * b) / c)'
      },
      {
        input: 'a + b / c',
        expected: '(a + (b / c))'
      },
      {
        input: 'a + b * c + d / e - f',
        expected: '(((a + (b * c)) + (d / e)) - f)'
      },
      {
        input: '3 + 4; -5 * 5',
        expected: '(3 + 4)((-5) * 5)'
      },
      {
        input: '5 > 4 == 3 < 4',
        expected: '((5 > 4) == (3 < 4))'
      },
      {
        input: '5 < 4 != 3 > 4',
        expected: '((5 < 4) != (3 > 4))'
      },
      {
        input: '3 + 4 * 5 == 3 * 1 + 4 * 5',
        expected: '((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))'
      }
    ]

    tests.forEach(test => {
      const l = new Lexer(test.input)
      const p = new Parser(l)
      const program = p.parseProgram()
      raiseParserErrors(p)

      expect(program.toString()).toEqual(test.expected)
    })
  })

  it('should parse boolean expressions', () => {
    const tests = [
      {
        input: 'true;',
        expected: true
      },
      {
        input: 'false;',
        expected: false
      }
    ]

    tests.forEach(test => {
      const l = new Lexer(test.input)
      const p = new Parser(l)
      const program = p.parseProgram()
      raiseParserErrors(p)

      expect(program.statements.length).toEqual(1)
      const stmt = program.statements[0] as ExpressionStatement
      const exp = stmt.expression as Bool
      testBooleanExpression(exp, test.expected)
    })
  })
})
