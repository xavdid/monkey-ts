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

  readChar() {
    if (this.readPosition > this.input.length) {
      this.ch = 0
    } else {
      this.ch = this.input.charCodeAt(this.readPosition)
    }
    this.position = this.readPosition
    this.readPosition += 1
  }

  nextToken() {
    let tok: Token

    this.skipWhitepsace()

    switch (numToString(this.ch)) {
      case '=':
        tok = this.generateToken(TOKENS.ASSIGN, this.ch)
        break
      case ';':
        tok = this.generateToken(TOKENS.SEMICOLON, this.ch)
        break
      case '(':
        tok = this.generateToken(TOKENS.LPAREN, this.ch)
        break
      case ')':
        tok = this.generateToken(TOKENS.RPAREN, this.ch)
        break
      case ',':
        tok = this.generateToken(TOKENS.COMMA, this.ch)
        break
      case '+':
        tok = this.generateToken(TOKENS.PLUS, this.ch)
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

  generateToken(type: TOKENS, char: number) {
    return new Token(type, numToString(char))
  }

  readIdentifier() {
    const startingPosition = this.position
    while (isLetter(this.ch)) {
      this.readChar()
    }
    return this.input.slice(startingPosition, this.position)
  }

  readNumber() {
    const startingPosition = this.position
    while (isDigit(this.ch)) {
      this.readChar()
    }
    return this.input.slice(startingPosition, this.position)
  }

  skipWhitepsace() {
    while ([' ', '\t', '\n', '\r'].includes(numToString(this.ch))) {
      this.readChar()
    }
  }
}
