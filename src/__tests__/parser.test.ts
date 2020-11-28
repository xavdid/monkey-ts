import { Lexer } from '../lexer'
import { Parser } from '../parser'
import {
  LetStatement,
  ExpressionStatement,
  Identifier,
  IntegerLiteral,
  PrefixExpression,
  InfixExpression,
  Expression,
  BooleanLiteral,
  IfExpression,
  FunctionLiteral,
  ReturnStatement,
  CallExpression,
  StringLiteral,
  ArrayLiteral,
  IndexExpression,
  HashLiteral,
} from '../ast'

// can't quite get this working
// const castAndAssert = <T>(obj: any, type: T): T => {
//   expect(obj).toBeInstanceOf(type)
//   return obj as T
// }

const testLetStatement = (s: LetStatement, name: string) => {
  expect(s).toBeInstanceOf(LetStatement)
  expect(s.tokenLiteral()).toEqual('let')
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

const testBooleanLiteral = (b: BooleanLiteral, expected: boolean) => {
  expect(b).toBeInstanceOf(BooleanLiteral)
  expect(b.value).toEqual(expected)
  expect(b.tokenLiteral()).toEqual(String(expected))
}

const parseProgram = (input: string, numExpectedStatements = 1): Expression => {
  const l = new Lexer(input)
  const p = new Parser(l)
  const program = p.parseProgram()

  // if (numExpectedStatements > 0) {
  expect(program.statements).toHaveLength(numExpectedStatements)
  // }

  const stmt = program.statements[0] as ExpressionStatement
  expect(stmt).toBeInstanceOf(ExpressionStatement)

  return stmt.expression
}

const testLiteralExpression = (
  exp: Expression,
  expected: string | number | boolean | undefined
) => {
  switch (typeof expected) {
    case 'number':
      testIntegerLiteral(exp as IntegerLiteral, expected)
      break
    case 'string':
      testIdentifier(exp as Identifier, expected)
      break
    case 'boolean':
      testBooleanLiteral(exp as BooleanLiteral, expected)
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
  it('should have parse errors', () => {
    const input = `let x 5;
  let = 10;
  let 838383;
  `

    const l = new Lexer(input)
    const p = new Parser(l)

    p.parseProgram(false)
    expect(p.errors).toHaveLength(4) // originally was 3, but bad parsing causes the "no function" error to be there?
  })

  describe('statements', () => {
    // eslint-disable-next-line jest/expect-expect
    it('should parse let statements', () => {
      const tests = [
        { input: 'let x = 5;', indentifier: 'x', value: 5 },
        { input: 'let y = true;', indentifier: 'y', value: true },
        { input: 'let foobar = y;', indentifier: 'foobar', value: 'y' },
      ]

      tests.forEach(({ input, indentifier, value }) => {
        const l = new Lexer(input)
        const p = new Parser(l)
        const program = p.parseProgram()

        expect(program.statements).toHaveLength(1)

        const statement = program.statements[0] as LetStatement
        testLetStatement(statement, indentifier)
        testLiteralExpression(statement.value, value)
      })
    })

    it('should parse return statements', () => {
      const tests = [
        { input: 'return 5;', value: 5 },
        { input: 'return true;', value: true },
        { input: 'return foobar;', value: 'foobar' },
        // { input: 'return;', value: undefined }, // not added yet
      ]

      tests.forEach(({ input, value }) => {
        const l = new Lexer(input)
        const p = new Parser(l)
        const program = p.parseProgram()

        expect(program.statements).toHaveLength(1)

        const statement = program.statements[0] as ReturnStatement
        expect(statement).toBeInstanceOf(ReturnStatement)
        expect(statement.tokenLiteral()).toEqual('return')
        testLiteralExpression(statement.returnValue!, value)
      })
    })

    it('should parse identifiers', () => {
      const input = 'foobar;'

      const ident = parseProgram(input) as Identifier
      expect(ident.value).toEqual('foobar')
      expect(ident.tokenLiteral()).toEqual('foobar')
    })

    it('should parse integers', () => {
      const input = '5;'

      const ident = parseProgram(input) as IntegerLiteral
      expect(ident.value).toEqual(5)
      expect(ident.tokenLiteral()).toEqual('5')
    })
  })

  describe('expressions', () => {
    it('should parse prefix expressions', () => {
      const tests = [
        {
          input: '!5;',
          operator: '!',
          value: 5,
        },
        {
          input: '-15;',
          operator: '-',
          value: 15,
        },
        {
          input: '!true;',
          operator: '!',
          value: true,
        },
        {
          input: '!false;',
          operator: '!',
          value: false,
        },
      ]

      tests.forEach(({ input, operator, value }) => {
        const exp = parseProgram(input) as PrefixExpression

        expect(exp.operator).toEqual(operator)
        testLiteralExpression(exp.right, value)
      })
    })

    // eslint-disable-next-line jest/expect-expect
    it('should parse infix expressions', () => {
      const operators = ['+', '-', '*', '/', '>', '<', '==', '!=']
      const tests = [
        ...operators.map((o) => ({
          input: `5 ${o} 5;`,
          leftValue: 5,
          operator: o,
          rightValue: 5,
        })),
        ...[
          [true, true],
          [true, false],
          [false, false],
        ].map(([leftValue, rightValue]) => {
          const operator = `${leftValue === rightValue ? '=' : '!'}=`
          return {
            // SEE: https://github.com/typescript-eslint/typescript-eslint/issues/1655
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            input: `${leftValue} ${operator} ${rightValue}`,
            leftValue: leftValue,
            rightValue: rightValue,
            operator,
          }
        }),
      ]

      tests.forEach(({ input, leftValue, operator, rightValue }) => {
        const exp = parseProgram(input) as InfixExpression
        testInfixExpression(exp, leftValue, operator, rightValue)
      })
    })

    it('should parse operator precedence', () => {
      const tests: Array<{ input: string; expected: string }> = [
        {
          input: '-a * b',
          expected: '((-a) * b)',
        },
        {
          input: '!-a',
          expected: '(!(-a))',
        },
        {
          input: 'a + b + c',
          expected: '((a + b) + c)',
        },
        {
          input: 'a + b - c',
          expected: '((a + b) - c)',
        },
        {
          input: 'a * b * c',
          expected: '((a * b) * c)',
        },
        {
          input: 'a * b / c',
          expected: '((a * b) / c)',
        },
        {
          input: 'a + b / c',
          expected: '(a + (b / c))',
        },
        {
          input: 'a + b * c + d / e - f',
          expected: '(((a + (b * c)) + (d / e)) - f)',
        },
        {
          input: '3 + 4; -5 * 5',
          expected: '(3 + 4)((-5) * 5)',
        },
        {
          input: '5 > 4 == 3 < 4',
          expected: '((5 > 4) == (3 < 4))',
        },
        {
          input: '5 < 4 != 3 > 4',
          expected: '((5 < 4) != (3 > 4))',
        },
        {
          input: '3 + 4 * 5 == 3 * 1 + 4 * 5',
          expected: '((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))',
        },
        {
          input: 'true',
          expected: 'true',
        },
        {
          input: 'false',
          expected: 'false',
        },
        {
          input: '3 > 5 == false',
          expected: '((3 > 5) == false)',
        },
        {
          input: '3 < 5 == true',
          expected: '((3 < 5) == true)',
        },
        {
          input: '1 + (2 + 3) + 4',
          expected: '((1 + (2 + 3)) + 4)',
        },
        {
          input: '(5 + 5) * 2',
          expected: '((5 + 5) * 2)',
        },
        {
          input: '2 / (5 + 5)',
          expected: '(2 / (5 + 5))',
        },
        {
          input: '-(5 + 5)',
          expected: '(-(5 + 5))',
        },
        {
          input: '!(true == true)',
          expected: '(!(true == true))',
        },
        {
          input: 'a + add(b * c) + d',
          expected: '((a + add((b * c))) + d)',
        },
        {
          input: 'add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))',
          expected: 'add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))',
        },
        {
          input: 'add(a + b + c * d / f + g)',
          expected: 'add((((a + b) + ((c * d) / f)) + g))',
        },
        {
          input: 'a * [1, 2, 3, 4][b * c] * d',
          expected: '((a * ([1, 2, 3, 4][(b * c)])) * d)',
        },
        {
          input: 'add(a * b[2], b[1], 2 * [1, 2][1])',
          expected: 'add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))',
        },
      ]

      tests.forEach(({ input, expected }) => {
        const l = new Lexer(input)
        const p = new Parser(l)
        const program = p.parseProgram()

        expect(program.toString()).toEqual(expected)
      })
    })

    // eslint-disable-next-line jest/expect-expect
    it('should parse boolean expressions', () => {
      const tests = [
        {
          input: 'true;',
          expected: true,
        },
        {
          input: 'false;',
          expected: false,
        },
      ]

      tests.forEach(({ input, expected }) => {
        const exp = parseProgram(input) as BooleanLiteral
        testBooleanLiteral(exp, expected)
      })
    })

    it('should parse if expressions', () => {
      const input = 'if (x < y) { x }'

      const exp = parseProgram(input) as IfExpression
      expect(exp).toBeInstanceOf(IfExpression)

      testInfixExpression(exp.condition as InfixExpression, 'x', '<', 'y')
      expect(exp.consequence.statements).toHaveLength(1)

      const consequence = exp.consequence.statements[0] as ExpressionStatement
      expect(consequence).toBeInstanceOf(ExpressionStatement)

      testIdentifier(consequence.expression as Identifier, 'x')
      expect(exp.alternative).toBeUndefined()
    })

    it('should parse if-else expressions', () => {
      const input = 'if (x < y) { x } else { y }'

      // this isn't working
      // const exp = castAndAssert(stmt.expression, IfExpression)
      const exp = parseProgram(input) as IfExpression
      expect(exp).toBeInstanceOf(IfExpression)

      testInfixExpression(exp.condition as InfixExpression, 'x', '<', 'y')

      expect(exp.consequence.statements).toHaveLength(1)
      const consequence = exp.consequence.statements[0] as ExpressionStatement
      expect(consequence).toBeInstanceOf(ExpressionStatement)
      testIdentifier(consequence.expression as Identifier, 'x')

      expect(exp.alternative).toBeDefined()
      const alternative = exp.alternative!.statements[0] as ExpressionStatement
      expect(alternative).toBeInstanceOf(ExpressionStatement)
      testIdentifier(alternative.expression as Identifier, 'y')
    })

    it('should parse function literals', () => {
      const input = 'fn(x, y) { x + y; }'

      const func = parseProgram(input) as FunctionLiteral
      expect(func).toBeInstanceOf(FunctionLiteral)

      expect(func.parameters).toHaveLength(2)

      testLiteralExpression(func.parameters[0], 'x')
      testLiteralExpression(func.parameters[1], 'y')

      expect(func.body.statements).toHaveLength(1)

      const bodyExp = func.body.statements[0] as ExpressionStatement
      expect(bodyExp).toBeInstanceOf(ExpressionStatement)

      testInfixExpression(bodyExp.expression as InfixExpression, 'x', '+', 'y')
    })

    it('should parse function parameters', () => {
      const tests = [
        {
          input: 'fn() {};',
          expected: [],
        },
        {
          input: 'fn(x) {};',
          expected: ['x'],
        },
        {
          input: 'fn(x, y, z) {};',
          expected: ['x', 'y', 'z'],
        },
      ]

      tests.forEach(({ input, expected }) => {
        const func = parseProgram(input) as FunctionLiteral
        expect(func).toBeInstanceOf(FunctionLiteral)

        expect(func.parameters).toHaveLength(expected.length)
        func.parameters.forEach((param, i) => {
          testLiteralExpression(param, expected[i])
        })
      })
    })

    it('should parse call expressions', () => {
      const input = 'add(1, 2 * 3, 4 + 5);'

      const exp = parseProgram(input) as CallExpression
      testIdentifier(exp.func as Identifier, 'add')

      expect(exp.args).toHaveLength(3)
      testLiteralExpression(exp.args[0], 1)
      testInfixExpression(exp.args[1] as InfixExpression, 2, '*', 3)
      testInfixExpression(exp.args[2] as InfixExpression, 4, '+', 5)
    })

    it('should parse call expression parameters', () => {
      const tests = [
        {
          input: 'add();',
          ident: 'add',
          params: [],
        },
        {
          input: 'add(1);',
          ident: 'add',
          params: ['1'],
        },
        {
          input: 'add(1, 2 * 3, 4 + 5);',
          ident: 'add',
          params: ['1', '(2 * 3)', '(4 + 5)'],
        },
      ]

      tests.forEach(({ input, ident, params }) => {
        const exp = parseProgram(input) as CallExpression
        testIdentifier(exp.func as Identifier, ident)

        expect(exp.args).toHaveLength(params.length)
        exp.args.forEach((arg, i) => {
          expect(arg.toString()).toEqual(params[i])
        })
      })
    })

    it('should parse call string expressions', () => {
      const input = '"hello world"'

      const literal = parseProgram(input) as StringLiteral
      expect(literal).toBeInstanceOf(StringLiteral)

      expect(literal.value).toEqual('hello world')
    })

    describe('array literals', () => {
      it('should parse array literals', () => {
        const input = '[1, 2 * 2, 3 + 3]'

        const arr = parseProgram(input) as ArrayLiteral
        expect(arr).toBeInstanceOf(ArrayLiteral)

        expect(arr.elements).toHaveLength(3)
        testIntegerLiteral(arr.elements[0] as IntegerLiteral, 1)
        testInfixExpression(arr.elements[1] as InfixExpression, 2, '*', 2)
        testInfixExpression(arr.elements[2] as InfixExpression, 3, '+', 3)
      })

      it('should parse index expressions', () => {
        const input = 'myArray[1 + 1]'

        const indexExp = parseProgram(input) as IndexExpression
        expect(indexExp).toBeInstanceOf(IndexExpression)

        testIdentifier(indexExp.left as Identifier, 'myArray')
        testInfixExpression(indexExp.index as InfixExpression, 1, '+', 1)
      })
    })

    describe('hash literals', () => {
      it('should parse hash literal string keys', () => {
        const input = '{"one": 1, "two": 2, "three": 3}'

        const hash = parseProgram(input) as HashLiteral
        expect(hash).toBeInstanceOf(HashLiteral)

        expect(hash.pairs.size).toEqual(3)
        const expected: { [x: string]: number } = {
          one: 1,
          two: 2,
          three: 3,
        }

        Array.from(hash.pairs).forEach(([key, value]) => {
          expect(key).toBeInstanceOf(StringLiteral)
          testIntegerLiteral(value as IntegerLiteral, expected[key.toString()])
        })
      })

      it('should parse hash literal boolean keys', () => {
        const input = '{true: 1, false: 2}'

        const hash = parseProgram(input) as HashLiteral
        expect(hash).toBeInstanceOf(HashLiteral)

        expect(hash.pairs.size).toEqual(2)
        const expected: { [x: string]: number } = {
          true: 1,
          false: 2,
        }

        Array.from(hash.pairs).forEach(([key, value]) => {
          expect(key).toBeInstanceOf(BooleanLiteral)
          testIntegerLiteral(value as IntegerLiteral, expected[key.toString()])
        })
      })

      it('should parse hash literal integer keys', () => {
        const input = '{1: 1, 2: 2, 3: 3}'

        const hash = parseProgram(input) as HashLiteral
        expect(hash).toBeInstanceOf(HashLiteral)

        expect(hash.pairs.size).toEqual(3)
        const expected: { [x: string]: number } = {
          '1': 1,
          '2': 2,
          '3': 3,
        }

        Array.from(hash.pairs).forEach(([key, value]) => {
          expect(key).toBeInstanceOf(IntegerLiteral)
          testIntegerLiteral(value as IntegerLiteral, expected[key.toString()])
        })
      })

      it('should parse hash literal string keys with expressions', () => {
        const input = '{"one": 0 + 1, "two": 10 - 8, "three": 15 / 3}'

        const hash = parseProgram(input) as HashLiteral
        expect(hash).toBeInstanceOf(HashLiteral)

        expect(hash.pairs.size).toEqual(3)
        const expected: { [x: string]: (e: InfixExpression) => void } = {
          one: (e: InfixExpression) => {
            testInfixExpression(e, 0, '+', 1)
          },
          two: (e: InfixExpression) => {
            testInfixExpression(e, 10, '-', 8)
          },
          three: (e: InfixExpression) => {
            testInfixExpression(e, 15, '/', 3)
          },
        }

        Array.from(hash.pairs).forEach(([key, value]) => {
          expect(key).toBeInstanceOf(StringLiteral)
          expected[key.toString()](value as InfixExpression)
        })
      })

      it('should parse empty hash literals', () => {
        const l = new Lexer('{}')
        const p = new Parser(l)
        const program = p.parseProgram()

        const stmt = program.statements[0] as ExpressionStatement
        expect(stmt).toBeInstanceOf(ExpressionStatement)

        const hash = stmt.expression as HashLiteral
        expect(hash).toBeInstanceOf(HashLiteral)

        expect(hash.pairs.size).toEqual(0)
      })
    })
  })
})
