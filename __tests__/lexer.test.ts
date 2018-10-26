import { Lexer } from '../src/lexer'
import { TOKENS } from '../src/token'

describe('lexer', () => {
  it('should parse simple input', () => {
    const input = '=+(){},;'
    const l = new Lexer(input)

    const testCases: Array<[TOKENS, string]> = [
      [TOKENS.ASSIGN, '='],
      [TOKENS.PLUS, '+'],
      [TOKENS.LPAREN, '('],
      [TOKENS.RPAREN, ')'],
      [TOKENS.LBRACE, '{'],
      [TOKENS.RBRACE, '}'],
      [TOKENS.COMMA, ','],
      [TOKENS.SEMICOLON, ';'],
      [TOKENS.EOF, '']
    ]
    const answers = testCases.map(([expectedType, expectedLiteral]) => ({
      expectedType,
      expectedLiteral
    }))

    answers.forEach(({ expectedType, expectedLiteral }) => {
      const tok = l.nextToken()

      expect(expectedType).toEqual(tok.type)
      expect(expectedLiteral).toEqual(tok.literal)
    })
  })

  it('should parse complex input', () => {
    const input = `let five = 5;
    let ten = 10;

    let add = fn(x, y) {
      x + y;
    };

    let result = add(five, ten);
    `
    const l = new Lexer(input)

    const testCases: Array<[TOKENS, string]> = [
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
      [TOKENS.EOF, '']
    ]
    const answers = testCases.map(([expectedType, expectedLiteral]) => ({
      expectedType,
      expectedLiteral
    }))

    answers.forEach(({ expectedType, expectedLiteral }) => {
      const tok = l.nextToken()

      expect(tok.type).toEqual(expectedType)
      expect(tok.literal).toEqual(expectedLiteral)
    })
  })
})
