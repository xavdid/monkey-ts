import { Token, TOKENS } from '../token'
import {
  LetStatement,
  Identifier,
  Program,
  IntegerLiteral,
  Node,
  ExpressionStatement,
  modify,
  InfixExpression,
  PrefixExpression,
  IndexExpression,
} from '../ast'

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

describe('modifying', () => {
  const one = () => new IntegerLiteral(new Token(TOKENS.INT, '1'), 1)
  const two = () => new IntegerLiteral(new Token(TOKENS.INT, '2'), 2)

  const turnOneIntoTwo = (node: Node): Node => {
    if (!(node instanceof IntegerLiteral)) {
      return node
    }
    if (node.value !== 1) {
      return node
    }

    // need to return a brand new node rather than modifying the input
    return two()
  }

  it('should modify a statement', () => {
    const tests: Array<{ input: Node; expected: Node }> = [
      { input: one(), expected: two() },
      {
        input: new Program([
          new ExpressionStatement(new Token(TOKENS.STRING, ''), one()),
        ]),
        expected: new Program([
          new ExpressionStatement(new Token(TOKENS.STRING, ''), two()),
        ]),
      },
      {
        input: new InfixExpression(
          new Token(TOKENS.STRING, ''),
          one(),
          '+',
          two()
        ),
        expected: new InfixExpression(
          new Token(TOKENS.STRING, ''),
          two(),
          '+',
          two()
        ),
      },
      {
        input: new InfixExpression(
          new Token(TOKENS.STRING, ''),
          two(),
          '+',
          one()
        ),
        expected: new InfixExpression(
          new Token(TOKENS.STRING, ''),
          two(),
          '+',
          two()
        ),
      },
      {
        input: new PrefixExpression(new Token(TOKENS.STRING, ''), '-', one()),
        expected: new PrefixExpression(
          new Token(TOKENS.STRING, ''),
          '-',
          two()
        ),
      },
      {
        input: new IndexExpression(new Token(TOKENS.STRING, ''), one(), one()),
        expected: new IndexExpression(
          new Token(TOKENS.STRING, ''),
          two(),
          two()
        ),
      },
    ]

    const validateIntegerLiteral = (m: IntegerLiteral, e: IntegerLiteral) => {
      expect(m).toBeInstanceOf(IntegerLiteral)
      expect(m.value).toEqual(e.value)
      expect(m.token.type).toEqual(e.token.type)
      expect(m.token.literal).toEqual(e.token.literal)
    }

    tests.forEach(({ input, expected }) => {
      const modified = modify(input, turnOneIntoTwo)

      if (
        modified instanceof IntegerLiteral &&
        expected instanceof IntegerLiteral
      ) {
        validateIntegerLiteral(modified, expected)
      } else if (modified instanceof Program && expected instanceof Program) {
        expect(modified.statements.length).toEqual(expected.statements.length)
        modified.statements.forEach((m, index) => {
          validateIntegerLiteral(
            (m as ExpressionStatement).expression as IntegerLiteral,
            (expected.statements[index] as ExpressionStatement)
              .expression as IntegerLiteral
          )
        })
      } else if (
        modified instanceof PrefixExpression &&
        expected instanceof PrefixExpression
      ) {
        validateIntegerLiteral(
          modified.right as IntegerLiteral,
          expected.right as IntegerLiteral
        )
        expect(modified.operator).toEqual(expected.operator)
      }
    })
  })
})
