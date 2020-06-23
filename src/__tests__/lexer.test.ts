/* eslint-disable jest/expect-expect */
// ^ ok to ignore because the assertions are in a helper

import { Lexer } from '../lexer'
import { TOKENS } from '../token'

type lexerResults = Array<[TOKENS, string]>

const validateAnswers = (testCases: lexerResults, l: Lexer) => {
  const answers = testCases.map(([expectedType, expectedLiteral]) => ({
    expectedType,
    expectedLiteral,
  }))

  answers.forEach(({ expectedType, expectedLiteral }) => {
    const tok = l.nextToken()
    expect(expectedType).toEqual(tok.type)
    expect(expectedLiteral).toEqual(tok.literal)
  })
}

describe('lexer', () => {
  it('should lex simple input', () => {
    const input = '=+(){},;'
    const l = new Lexer(input)

    const resultingTokens: lexerResults = [
      [TOKENS.ASSIGN, '='],
      [TOKENS.PLUS, '+'],
      [TOKENS.LPAREN, '('],
      [TOKENS.RPAREN, ')'],
      [TOKENS.LBRACE, '{'],
      [TOKENS.RBRACE, '}'],
      [TOKENS.COMMA, ','],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.EOF, ''],
    ]

    validateAnswers(resultingTokens, l)
  })

  it('should lex complex input', () => {
    const input = `let five = 5;
    let ten = 10;

    let add = fn(x, y) {
      x + y;
    };

    let result = add(five, ten);

    !-/*5;
    5 < 10 > 5;

    if (5 < 10) {
      return true;
    } else {
      return false;
    }
    `
    const l = new Lexer(input)

    const resultingTokens: lexerResults = [
      [TOKENS.LET, 'let'],
      [TOKENS.IDENT, 'five'],
      [TOKENS.ASSIGN, '='],
      [TOKENS.INT, '5'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.LET, 'let'],
      [TOKENS.IDENT, 'ten'],
      [TOKENS.ASSIGN, '='],
      [TOKENS.INT, '10'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.LET, 'let'],
      [TOKENS.IDENT, 'add'],
      [TOKENS.ASSIGN, '='],
      [TOKENS.FUNCTION, 'fn'],
      [TOKENS.LPAREN, '('],
      [TOKENS.IDENT, 'x'],
      [TOKENS.COMMA, ','],
      [TOKENS.IDENT, 'y'],
      [TOKENS.RPAREN, ')'],
      [TOKENS.LBRACE, '{'],
      [TOKENS.IDENT, 'x'],
      [TOKENS.PLUS, '+'],
      [TOKENS.IDENT, 'y'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.RBRACE, '}'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.LET, 'let'],
      [TOKENS.IDENT, 'result'],
      [TOKENS.ASSIGN, '='],
      [TOKENS.IDENT, 'add'],
      [TOKENS.LPAREN, '('],
      [TOKENS.IDENT, 'five'],
      [TOKENS.COMMA, ','],
      [TOKENS.IDENT, 'ten'],
      [TOKENS.RPAREN, ')'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.BANG, '!'],
      [TOKENS.MINUS, '-'],
      [TOKENS.SLASH, '/'],
      [TOKENS.ASTERISK, '*'],
      [TOKENS.INT, '5'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.INT, '5'],
      [TOKENS.LT, '<'],
      [TOKENS.INT, '10'],
      [TOKENS.GT, '>'],
      [TOKENS.INT, '5'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.IF, 'if'],
      [TOKENS.LPAREN, '('],
      [TOKENS.INT, '5'],
      [TOKENS.LT, '<'],
      [TOKENS.INT, '10'],
      [TOKENS.RPAREN, ')'],
      [TOKENS.LBRACE, '{'],
      [TOKENS.RETURN, 'return'],
      [TOKENS.TRUE, 'true'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.RBRACE, '}'],
      [TOKENS.ELSE, 'else'],
      [TOKENS.LBRACE, '{'],
      [TOKENS.RETURN, 'return'],
      [TOKENS.FALSE, 'false'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.RBRACE, '}'],
      [TOKENS.EOF, ''],
    ]

    validateAnswers(resultingTokens, l)
  })

  it('should lex multi-character operators', () => {
    const input = `10 == 10;
    10 != 9;`

    const l = new Lexer(input)
    const resultingTokens: lexerResults = [
      [TOKENS.INT, '10'],
      [TOKENS.EQ, '=='],
      [TOKENS.INT, '10'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.INT, '10'],
      [TOKENS.NOT_EQ, '!='],
      [TOKENS.INT, '9'],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.EOF, ''],
    ]

    validateAnswers(resultingTokens, l)
  })
})
