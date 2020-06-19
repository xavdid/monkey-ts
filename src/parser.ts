import { Token, TOKENS } from './token'
import { Lexer } from './lexer'
import {
  Program,
  LetStatement,
  Identifier,
  ReturnStatement,
  Expression,
  ExpressionStatement,
  IntegerLiteral,
  PrefixExpression,
  InfixExpression,
  BoolExpression,
  IfExpression,
  BlockStatement,
  Statement,
  FunctionLiteral,
  CallExpression,
} from './ast'

type prefixParserFn = () => Expression | undefined
type infixParseFn = (e: Expression) => Expression

const enum PRECEDENCE_LEVELS {
  LOWEST,
  EQUALS, // ==
  LESSGREATER, // < or >
  SUM, // + or -
  PRODUCT, // * or /
  PREFIX, // -X or !X
  CALL, // myFunc(X)
}

const OPERATOR_PRECEDENCE: { [k in TOKENS]?: PRECEDENCE_LEVELS } = {
  [TOKENS.LPAREN]: PRECEDENCE_LEVELS.CALL,
  [TOKENS.EQ]: PRECEDENCE_LEVELS.EQUALS,
  [TOKENS.NOT_EQ]: PRECEDENCE_LEVELS.EQUALS,
  [TOKENS.LT]: PRECEDENCE_LEVELS.LESSGREATER,
  [TOKENS.GT]: PRECEDENCE_LEVELS.LESSGREATER,
  [TOKENS.PLUS]: PRECEDENCE_LEVELS.SUM,
  [TOKENS.MINUS]: PRECEDENCE_LEVELS.SUM,
  [TOKENS.SLASH]: PRECEDENCE_LEVELS.PRODUCT,
  [TOKENS.ASTERISK]: PRECEDENCE_LEVELS.PRODUCT,
}

export class Parser {
  // these are always defined, since a funciton in the constructor assigns it
  private curToken!: Token
  private peekToken!: Token
  errors: string[] = []
  // [k in TOKENS]: alsmost works, but given that the rest are missing it complains
  // partial didn't seem to do it either
  private readonly prefixParseFns: { [x: string]: prefixParserFn }
  private readonly infixParseFns: { [x: string]: infixParseFn }
  private parsed = false

  constructor(private readonly lexer: Lexer) {
    this.prefixParseFns = {
      [TOKENS.IDENT]: this.parseIdentifier,
      [TOKENS.INT]: this.parseIntegerLiteral,
      [TOKENS.BANG]: this.parsePrefixExpression,
      [TOKENS.MINUS]: this.parsePrefixExpression,
      [TOKENS.TRUE]: this.parseBoolean,
      [TOKENS.FALSE]: this.parseBoolean,
      [TOKENS.LPAREN]: this.parseGroupedExpression,
      [TOKENS.IF]: this.parseIfExpression,
      [TOKENS.FUNCTION]: this.parseFunctionLiteral,
    }
    this.infixParseFns = {
      [TOKENS.EQ]: this.parseInfixExpression,
      [TOKENS.NOT_EQ]: this.parseInfixExpression,
      [TOKENS.LT]: this.parseInfixExpression,
      [TOKENS.GT]: this.parseInfixExpression,
      [TOKENS.PLUS]: this.parseInfixExpression,
      [TOKENS.MINUS]: this.parseInfixExpression,
      [TOKENS.SLASH]: this.parseInfixExpression,
      [TOKENS.ASTERISK]: this.parseInfixExpression,
      [TOKENS.LPAREN]: this.parseCallExpression,
    }
    // read two tokens, so cur and peek are both set
    this.nextToken()
    this.nextToken()
  }

  // MECHANICAL //
  /**
   * advance the pointer
   */
  private readonly nextToken = () => {
    this.curToken = this.peekToken
    this.peekToken = this.lexer.nextToken()
  }

  private readonly peekPrecedence = () => this._getPrecedence(this.peekToken)

  private readonly curPrecedence = () => this._getPrecedence(this.curToken)

  // PARSERS //
  private readonly throwNoPrefixParseFnError = (t: string) => {
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
    this.parsed = true
    return program
  }

  raiseParserErrors = () => {
    if (!this.parsed) {
      return
    }

    if (this.errors.length) {
      throw new Error(this.errors.join('\n'))
    }
  }

  private readonly parseStatement = () => {
    switch (this.curToken.type) {
      case TOKENS.LET:
        return this.parseLetStatement()
      case TOKENS.RETURN:
        return this.parseReturnStatement()
      default:
        return this.parseExpressionStatement()
    }
  }

  private readonly parseLetStatement = () => {
    const letToken = this.curToken
    if (!this.expectAndAdvance(TOKENS.IDENT)) {
      return
    }

    const name = new Identifier(this.curToken, this.curToken.literal)
    if (!this.expectAndAdvance(TOKENS.ASSIGN)) {
      return
    }

    this.nextToken()

    const value = this.parseExpression(PRECEDENCE_LEVELS.LOWEST)

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken()
    }

    return new LetStatement(letToken, name, value!)
  }

  private readonly parseReturnStatement = () => {
    const token = this.curToken

    this.nextToken()

    const returnValue = this.parseExpression(PRECEDENCE_LEVELS.LOWEST)

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken()
    }

    return new ReturnStatement(token, returnValue)
  }

  private readonly parseExpressionStatement = () => {
    const stmt = new ExpressionStatement(
      this.curToken,
      this.parseExpression(PRECEDENCE_LEVELS.LOWEST)
    )

    if (this.peekTokenIs(TOKENS.SEMICOLON)) {
      this.nextToken()
    }

    return stmt
  }

  private readonly parseExpression = (
    precedence: PRECEDENCE_LEVELS
  ): Expression | undefined => {
    const prefixParserFn = this.prefixParseFns[this.curToken.type]
    if (!prefixParserFn) {
      this.throwNoPrefixParseFnError(this.curToken.type)
      return
    }
    let leftExpression = prefixParserFn()

    while (
      !this.peekTokenIs(TOKENS.SEMICOLON) &&
      precedence < this.peekPrecedence()
    ) {
      const infixParserFn = this.infixParseFns[this.peekToken.type]
      if (!infixParserFn) {
        return leftExpression
      }

      this.nextToken()

      // this needs the ! because parseGroupedExpression can return undefined
      // it only does that when parens are mismatched though, so this is safe to assert
      leftExpression = infixParserFn(leftExpression!)
    }

    return leftExpression
  }

  // these need to be fat arrow so they can be referenced but not called
  private readonly parseIdentifier = () => {
    return new Identifier(this.curToken, this.curToken.literal)
  }

  private readonly parseIntegerLiteral = () => {
    const value = parseInt(this.curToken.literal, 10)
    if (isNaN(value)) {
      this.errors.push('could not parse', this.curToken.literal, 'as integer')
      return
    }
    return new IntegerLiteral(this.curToken, value)
  }

  private readonly parsePrefixExpression = () => {
    const expression = new PrefixExpression(
      this.curToken,
      this.curToken.literal
    )

    this.nextToken()

    expression.right = this.parseExpression(PRECEDENCE_LEVELS.PREFIX)

    return expression
  }

  private readonly parseInfixExpression = (left: Expression) => {
    const expression = new InfixExpression(
      this.curToken,
      left,
      this.curToken.literal
    )

    const precedence = this.curPrecedence()
    this.nextToken()
    // could if on expression.operator and decrement for + to make it hug right
    expression.right = this.parseExpression(precedence)

    return expression
  }

  private readonly parseBoolean = () =>
    new BoolExpression(this.curToken, this.curTokenIs(TOKENS.TRUE))

  private readonly parseGroupedExpression = () => {
    this.nextToken()
    const expression = this.parseExpression(PRECEDENCE_LEVELS.LOWEST)
    if (!this.expectAndAdvance(TOKENS.RPAREN)) {
      return
    }
    return expression
  }

  private readonly parseIfExpression = () => {
    // build an expression
    const token = this.curToken
    if (!this.expectAndAdvance(TOKENS.LPAREN)) {
      return
    }
    this.nextToken()
    const condition = this.parseExpression(PRECEDENCE_LEVELS.LOWEST)

    if (!this.expectAndAdvance(TOKENS.RPAREN)) {
      return
    }

    if (!this.expectAndAdvance(TOKENS.LBRACE)) {
      return
    }

    const consequence = this.parseBlockStatement()
    let alternative: BlockStatement | undefined

    if (this.peekTokenIs(TOKENS.ELSE)) {
      this.nextToken()
      if (!this.expectAndAdvance(TOKENS.LBRACE)) {
        return
      }

      alternative = this.parseBlockStatement()
    }

    return new IfExpression(token, condition!, consequence, alternative)
  }

  private readonly parseBlockStatement = () => {
    const token = this.curToken
    const statements: Statement[] = []

    this.nextToken()
    while (!this.curTokenIs(TOKENS.RBRACE) && !this.curTokenIs(TOKENS.EOF)) {
      const statement = this.parseStatement()
      if (statement) {
        statements.push(statement)
      }
      this.nextToken()
    }
    return new BlockStatement(token, statements)
  }

  private readonly parseFunctionLiteral = () => {
    const token = this.curToken

    if (!this.expectAndAdvance(TOKENS.LPAREN)) {
      return
    }

    const parameters = this.parseFunctionParameters()

    if (!this.expectAndAdvance(TOKENS.LBRACE)) {
      return
    }

    const body = this.parseBlockStatement()

    return new FunctionLiteral(token, parameters!, body)
  }

  private readonly parseFunctionParameters = () => {
    const identifers: Identifier[] = []

    // no params
    if (this.peekTokenIs(TOKENS.RPAREN)) {
      this.nextToken()
      return identifers
    }

    this.nextToken()

    identifers.push(new Identifier(this.curToken, this.curToken.literal))

    // TODO: this is probably a do-while?
    while (this.peekTokenIs(TOKENS.COMMA)) {
      this.nextToken()
      this.nextToken()
      identifers.push(new Identifier(this.curToken, this.curToken.literal))
    }

    if (!this.expectAndAdvance(TOKENS.RPAREN)) {
      return
    }

    return identifers
  }

  private readonly parseCallExpression = (func: Expression) => {
    const token = this.curToken
    const args = this.parseCallArguments()
    return new CallExpression(token, func, args!)
  }

  private readonly parseCallArguments = () => {
    const args: Expression[] = []

    if (this.peekTokenIs(TOKENS.RPAREN)) {
      this.nextToken()
      return args
    }

    this.nextToken()

    args.push(this.parseExpression(PRECEDENCE_LEVELS.LOWEST)!)

    while (this.peekTokenIs(TOKENS.COMMA)) {
      this.nextToken()
      this.nextToken()

      args.push(this.parseExpression(PRECEDENCE_LEVELS.LOWEST)!)
    }

    if (!this.expectAndAdvance(TOKENS.RPAREN)) {
      return
    }

    return args
  }

  // HELPERS //
  private readonly curTokenIs = (t: TOKENS) => this.curToken.type === t

  private readonly peekTokenIs = (t: TOKENS) => this.peekToken.type === t

  /**
   * in the book it's `expectPeek`, which is a bad name
   */
  private readonly expectAndAdvance = (t: TOKENS) => {
    if (this.peekTokenIs(t)) {
      this.nextToken()
      return true
    } else {
      this.peekError(t)
      return false
    }
  }

  private readonly peekError = (t: TOKENS) => {
    this.errors.push(
      `expected next token to be ${t}, got ${this.peekToken.type} instead`
    )
  }

  private readonly _getPrecedence = (t: Token) => {
    return OPERATOR_PRECEDENCE[t.type] ?? PRECEDENCE_LEVELS.LOWEST
  }
}
