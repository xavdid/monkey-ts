import { TOKENS, Token, lookupIdent } from './token'
import { numToString, stringToNum, isLetter, isDigit } from './utils'

export class Lexer {
  input: string
  position: number
  readPosition: number
  ch: number // char code

  constructor(input: string) {
    this.input = input
    this.position = 0
    this.readPosition = 0
    this.ch = 0

    this.readChar()
  }

  nextToken = () => {
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

  generateToken = (type: TOKENS, char: number) => {
    return new Token(type, numToString(char))
  }

  readIdentifier = () => {
    // DEVIATION: made a root function for reading
    return this._read(isLetter)
  }

  readNumber = () => {
    return this._read(isDigit)
  }

  readChar = () => {
    // DEVIATION: use peekChar here instead of repeating code
    this.ch = stringToNum(this.peekChar())
    this.position = this.readPosition
    this.readPosition += 1
  }

  maybeReadSecondChar = (yes: TOKENS, no: TOKENS, second: string) => {
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

  peekChar = () => {
    // DEVIATION: don't read past the end of the string
    // DEVIATION: this returns an actual character instead of a char code
    if (this.readPosition >= this.input.length) {
      return numToString(0)
    } else {
      return this.input[this.readPosition]
    }
  }

  skipWhitepsace = () => {
    while ([' ', '\t', '\n', '\r'].includes(numToString(this.ch))) {
      this.readChar()
    }
  }

  private _read = (fn: (ch: number) => boolean) => {
    const startingPosition = this.position
    while (fn(this.ch)) {
      this.readChar()
    }
    return this.input.slice(startingPosition, this.position)
  }
}
