import { Token, TOKENS } from './token'
import { Lexer } from './lexer'
import {
  Program,
  Statement,
  LetStatement,
  Identifier,
  ReturnStatement,
  Expression,
  ExpressionStatement,
  IntegerLiteral,
  PrefixExpression
} from './ast'

type prefixParserFn = () => Expression
type infixParseFn = (e: Expression) => Expression

const enum PRECEDENCE {
  LOWEST,
  EQUALS, // ==
  LESSGREATER, // < or >
  SUM, // +
  PRODUCT, // *
  PREFIX, // -X or !X
  CALL // myFunc(X)
}

export class Parser {
  curToken!: Token
  peekToken!: Token
  errors: string[] = []
  // [k in TOKENS]: alsmost works, but given that the rest are missing it complains
  // partial didn't seem to do it either
  prefixParseFns: { [x: string]: prefixParserFn }
  infixParseFns: { [x: string]: infixParseFn }

  constructor(public lexer: Lexer) {
    this.prefixParseFns = {
      [TOKENS.IDENT]: this.parseIdentifier,
      [TOKENS.INT]: this.parseIntegerLiteral,
      [TOKENS.BANG]: this.parsePrefixExpression,
      [TOKENS.MINUS]: this.parsePrefixExpression
    }
    this.infixParseFns = {}
    // read two tokens, so cur and peek are both set
    this.nextToken()
    this.nextToken()
  }

  // MECHANICAL //
  nextToken = () => {
    this.curToken = this.peekToken
    this.peekToken = this.lexer.nextToken()
  }

  // PARSERS //
  noPrefixParseFnError = (t: string) => {
    const msg = `no prefix parse function for ${t} found`
    this.errors.push(msg)
  }

  parseProgram = () => {
    const program = new Program()
    while (this.curToken.type !== TOKENS.EOF) {
      // TODO: might be able to clean this up
      const s = this.parseStatement()
      if (s) {
        program.statements.push(s)
      }
      this.nextToken()
    }
    return program
  }

  parseStatement = () => {
    switch (this.curToken.type) {
      case TOKENS.LET:
        return this.parseLetStatement()
      case TOKENS.RETURN:
        return this.parseReturnStatement()
      default:
        return this.parseExpressionStatement()
    }
  }

  parseLetStatement = () => {
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

  parseReturnStatement = () => {
    const stmt = new ReturnStatement(this.curToken)

    this.nextToken()
    while (!this.curTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken()
    }
    return stmt
  }

  parseExpressionStatement = () => {
    const stmt = new ExpressionStatement(
      this.curToken,
      this.parseExpression(PRECEDENCE.LOWEST)
    )

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken()
    }

    return stmt
  }

  parseExpression = (p: PRECEDENCE) => {
    const prefix = this.prefixParseFns[this.curToken.type]
    if (!prefix) {
      this.noPrefixParseFnError(this.curToken.type)
      return
    }
    return prefix() // leftExp
  }

  // these need to be fat arrow so they can be referenced but not called
  parseIdentifier = () => {
    return new Identifier(this.curToken, this.curToken.literal)
  }

  parseIntegerLiteral = () => {
    const value = parseInt(this.curToken.literal, 10)
    if (isNaN(value)) {
      this.errors.push('could not parse', this.curToken.literal, 'as integer')
      // return
    }
    return new IntegerLiteral(this.curToken, value)
  }

  parsePrefixExpression = () => {
    const expression = new PrefixExpression(
      this.curToken,
      this.curToken.literal
    )

    this.nextToken()

    expression.right = this.parseExpression(PRECEDENCE.PREFIX)

    return expression
  }

  // HELPERS //
  curTokenIs = (t: TOKENS) => {
    return this.curToken.type === t
  }

  peekTokenIs = (t: TOKENS) => {
    return this.peekToken.type === t
  }

  expectAndAdvance = (t: TOKENS) => {
    if (this.peekTokenIs(t)) {
      this.nextToken()
      return true
    } else {
      this.peekError(t)
      return false
    }
  }

  peekError = (t: TOKENS) => {
    this.errors.push(
      `expected next token to be ${t}, got ${this.peekToken.type} instead`
    )
  }
}
