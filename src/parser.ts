import { Token, TOKENS } from './token'
import { Lexer } from './lexer'
import {
  Program,
  Statement,
  LetStatement,
  Identifier,
  ReturnStatement
} from './ast'

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
      case TOKENS.RETURN:
        return this.parseReturnStatement()
      default:
        return null
    }
  }

  // stmt.Name = &ast.Identifier{Token: p.curToken, Value: p.curToken.Literal}

  parseLetStatement() {
    // const stmt = new LetStatement()
    // TODO: fix constructor
    const letToken = this.curToken
    if (!this.expectAndAdvance(TOKENS.IDENT)) {
      return null
    }

    const name = new Identifier(this.curToken, this.curToken.literal)
    if (!this.expectAndAdvance(TOKENS.ASSIGN)) {
      return null
    }

    // TODO: coming back
    while (!this.curTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken()
    }

    const stmt = new LetStatement(
      letToken,
      name,
      new Identifier(new Token(TOKENS.INT, '0'), '0') // TODO: remove
    )

    return stmt
  }

  parseReturnStatement() {
    const stmt = new ReturnStatement(this.curToken)

    this.nextToken()
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

  expectAndAdvance(t: TOKENS) {
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
