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
  PrefixExpression,
  InfixExpression
} from './ast'

type prefixParserFn = () => Expression
type infixParseFn = (e: Expression) => Expression

const enum PRECEDENCE {
  LOWEST,
  EQUALS, // ==
  LESSGREATER, // < or >
  SUM, // + or -
  PRODUCT, // * or /
  PREFIX, // -X or !X
  CALL // myFunc(X)
}

const PRECEDENCES: { [x: string]: PRECEDENCE } = {
  [TOKENS.EQ]: PRECEDENCE.EQUALS,
  [TOKENS.NOT_EQ]: PRECEDENCE.EQUALS,
  [TOKENS.LT]: PRECEDENCE.LESSGREATER,
  [TOKENS.GT]: PRECEDENCE.LESSGREATER,
  [TOKENS.PLUS]: PRECEDENCE.SUM,
  [TOKENS.MINUS]: PRECEDENCE.SUM,
  [TOKENS.SLASH]: PRECEDENCE.PRODUCT,
  [TOKENS.ASTERISK]: PRECEDENCE.PRODUCT
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
    this.infixParseFns = {
      [TOKENS.EQ]: this.parseInfixExpression,
      [TOKENS.NOT_EQ]: this.parseInfixExpression,
      [TOKENS.LT]: this.parseInfixExpression,
      [TOKENS.GT]: this.parseInfixExpression,
      [TOKENS.PLUS]: this.parseInfixExpression,
      [TOKENS.MINUS]: this.parseInfixExpression,
      [TOKENS.SLASH]: this.parseInfixExpression,
      [TOKENS.ASTERISK]: this.parseInfixExpression
    }
    // read two tokens, so cur and peek are both set
    this.nextToken()
    this.nextToken()
  }

  // MECHANICAL //
  nextToken = () => {
    this.curToken = this.peekToken
    this.peekToken = this.lexer.nextToken()
  }

  peekPrecedence = () => {
    return this._getPrecedence(this.peekToken)
  }

  curPrecedence = () => {
    return this._getPrecedence(this.curToken)
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
      return
    }

    const name = new Identifier(this.curToken, this.curToken.literal)
    if (!this.expectAndAdvance(TOKENS.ASSIGN)) {
      return
    }

    while (!this.curTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken()
    }

    const stmt = new LetStatement(letToken, name)

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
    let left = prefix()

    while (!this.peekTokenIs(TOKENS.SEMICOLON) && p < this.peekPrecedence()) {
      const infix = this.infixParseFns[this.peekToken.type]
      if (!infix) {
        return left
      }

      this.nextToken()

      left = infix(left)
    }

    return left
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

  parseInfixExpression = (left: Expression) => {
    const expression = new InfixExpression(
      this.curToken,
      left,
      this.curToken.literal
    )

    const precedence = this.curPrecedence()
    this.nextToken()
    expression.right = this.parseExpression(precedence)

    return expression
  }

  // HELPERS //
  curTokenIs = (t: TOKENS) => {
    return this.curToken.type === t
  }

  peekTokenIs = (t: TOKENS) => {
    return this.peekToken.type === t
  }

  /**
   * in the book it's `expectPeek`, which is a bad name
   */
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

  private _getPrecedence = (t: Token) => {
    return PRECEDENCES[t.type] || PRECEDENCE.LOWEST
  }
}
