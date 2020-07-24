import { TOKENS, Token, lookupIdent } from './token'
import {
  numToString,
  stringToNum,
  isLetter,
  isDigit,
  notDoubleQuote,
} from './utils'

export class Lexer {
  position: number
  readPosition: number
  ch: number // char code

  constructor(private readonly input: string) {
    this.input = input
    this.position = 0
    this.readPosition = 0
    this.ch = 0

    this.readChar()
  }

  nextToken() {
    let tok: Token

    this.skipWhitepsace()

    switch (numToString(this.ch)) {
      case '=':
        tok = this.maybeReadSecondChar(TOKENS.EQ, TOKENS.ASSIGN, '=')
        break
      case '+':
        tok = this.generateToken(TOKENS.PLUS, this.ch)
        break
      case '-':
        tok = this.generateToken(TOKENS.MINUS, this.ch)
        break
      case '!':
        tok = this.maybeReadSecondChar(TOKENS.NOT_EQ, TOKENS.BANG, '=')
        break
      case '/':
        tok = this.generateToken(TOKENS.SLASH, this.ch)
        break
      case '*':
        tok = this.generateToken(TOKENS.ASTERISK, this.ch)
        break
      case '<':
        tok = this.generateToken(TOKENS.LT, this.ch)
        break
      case '>':
        tok = this.generateToken(TOKENS.GT, this.ch)
        break
      case ';':
        tok = this.generateToken(TOKENS.SEMICOLON, this.ch)
        break
      case ',':
        tok = this.generateToken(TOKENS.COMMA, this.ch)
        break
      case '(':
        tok = this.generateToken(TOKENS.LPAREN, this.ch)
        break
      case ')':
        tok = this.generateToken(TOKENS.RPAREN, this.ch)
        break
      case '{':
        tok = this.generateToken(TOKENS.LBRACE, this.ch)
        break
      case '}':
        tok = this.generateToken(TOKENS.RBRACE, this.ch)
        break
      case '"':
        // don't use generateToken because we have to read multiple characters
        tok = new Token(TOKENS.STRING, this.readString())
        break
      case '[':
        tok = this.generateToken(TOKENS.LBRACKET, this.ch)
        break
      case ']':
        tok = this.generateToken(TOKENS.RBRACKET, this.ch)
        break
      case ':':
        tok = this.generateToken(TOKENS.COLON, this.ch)
        break
      case numToString(0):
        tok = new Token(TOKENS.EOF, '')
        break
      default:
        if (isLetter(this.ch)) {
          const literal = this.readIdentifier()
          return new Token(lookupIdent(literal), literal)
        } else if (isDigit(this.ch)) {
          return new Token(TOKENS.INT, this.readNumber())
        } else {
          tok = this.generateToken(TOKENS.ILLEGAL, this.ch)
        }
    }

    this.readChar()
    return tok
  }

  private generateToken(type: TOKENS, char: number) {
    return new Token(type, numToString(char))
  }

  private readIdentifier() {
    // DEVIATION: made a root function for reading
    return this.readWhile(isLetter)
  }

  private readNumber() {
    return this.readWhile(isDigit)
  }

  private readString() {
    // is mostly normal, but needs an offset
    return this.readWhile(notDoubleQuote).slice(1)
  }

  /**
   * advances the position while we're in a string
   */
  private readonly readChar = () => {
    // DEVIATION: use peekChar here instead of repeating code
    this.ch = stringToNum(this.peekChar())
    this.position = this.readPosition
    this.readPosition += 1
  }

  private maybeReadSecondChar(yes: TOKENS, no: TOKENS, second: string): Token {
    // DEVIATION: consolidate second character behavior
    if (this.peekChar() === second) {
      const ch = this.ch
      this.readChar()
      const literal = numToString(ch) + numToString(this.ch)
      return new Token(yes, literal)
    } else {
      return this.generateToken(no, this.ch)
    }
  }

  private peekChar(): string {
    // DEVIATION: don't read past the end of the string
    // DEVIATION: this returns an actual character instead of a char code
    if (this.readPosition >= this.input.length) {
      return numToString(0)
    } else {
      return this.input[this.readPosition]
    }
  }

  private skipWhitepsace() {
    while ([' ', '\t', '\n', '\r'].includes(numToString(this.ch))) {
      this.readChar()
    }
  }

  /**
   * returns a slice of the input as long as the next character matches the filter
   */
  private readWhile(fn: (ch: number) => boolean) {
    const startingPosition = this.position
    // DEVIATION: his is a while, mine is a do-while. tests pass though ¯\_(ツ)_/¯
    // could add an extra readChar behind an `if` if it turns out the do-while messes something up
    do {
      this.readChar()
    } while (fn(this.ch))
    return this.input.slice(startingPosition, this.position)
  }
}
