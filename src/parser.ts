import { Token, TOKENS } from './token'
import { Lexer } from './lexer'
import { Program, Statement, LetStatement, Identifier } from './ast'

export class Parser {
  curToken!: Token
  peekToken!: Token
  lexer: Lexer
  errors: string[]

  constructor(l: Lexer) {
    this.lexer = l
    this.errors = []
    // read two tokens, so cur and peek are both set
    this.nextToken()
    this.nextToken()
  }

  nextToken() {
    this.curToken = this.peekToken
    this.peekToken = this.lexer.nextToken()
  }

  parseProgram() {
    const program = new Program()
    while (this.curToken.type !== TOKENS.EOF) {
      const s = this.parseStatement()
      if (s) {
        program.statements.push(s)
      }
      this.nextToken()
    }
    return program
  }

  parseStatement() {
    switch (this.curToken.type) {
      case TOKENS.LET:
        return this.parseLetStatement()
      default:
        return null
    }
  }

  parseLetStatement() {
    const stmt = new LetStatement()
    // TODO: fix constructor
    stmt.token = this.curToken
    if (!this.expectPeek(TOKENS.IDENT)) {
      return null
    }
    stmt.name = new Identifier(this.curToken.literal)
    // TODO: fix constructor
    stmt.name.token = this.curToken

    if (!this.expectPeek(TOKENS.ASSIGN)) {
      return null
    }

    // TODO: coming back
    while (!this.curTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken()
    }

    return stmt
  }

  curTokenIs(t: TOKENS) {
    return this.curToken.type === t
  }

  peekTokenIs(t: TOKENS) {
    return this.peekToken.type === t
  }

  expectPeek(t: TOKENS) {
    if (this.peekTokenIs(t)) {
      this.nextToken()
      return true
    } else {
      this.peekError(t)
      return false
    }
  }

  peekError(t: TOKENS) {
    this.errors.push(
      `expected next token to be ${t}, got ${this.peekToken.type} instead`
    )
  }
}
