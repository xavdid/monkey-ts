import { TOKENS, Token } from './token'

interface Node {
  tokenLiteral: () => string
  toString: () => string
}

export interface Statement extends Node {
  statementNode: () => Node // for testing so we know we have the correct node
}

export interface Expression extends Node {
  expressionNode: () => Node // for testing so we know we have the correct node
}

export class Program {
  statements: Statement[] = []

  tokenLiteral = () => {
    if (this.statements.length) {
      return this.statements[0].tokenLiteral()
    } else {
      return ''
    }
  }

  toString = () => {
    return this.statements.map(String).join('\n')
  }
}

export class LetStatement implements Statement {
  constructor(
    public token: Token,
    public name: Identifier,
    public value: Expression
  ) {}

  statementNode = () => {
    return this
  }
  tokenLiteral = () => {
    return this.token.literal
  }
  toString = () => {
    return `${this.tokenLiteral()} ${this.name} = ${
      this.value ? this.value : ''
    };`
  }
}

export class ReturnStatement implements Statement {
  constructor(public token: Token, public returnValue?: Expression) {}

  statementNode = () => {
    return this
  }

  tokenLiteral = () => {
    return this.token.literal
  }

  toString = () => {
    return `${this.tokenLiteral()} ${this.returnValue || ''};`
  }
}

export class ExpressionStatement implements Statement {
  constructor(public token: Token, public expression?: Expression) {}

  statementNode = () => {
    return this
  }
  tokenLiteral = () => {
    return this.token.literal
  }

  toString = () => {
    return String(this.expression)
  }
}

export class Identifier implements Expression {
  constructor(public token: Token, public value: string) {}

  expressionNode = () => {
    return this
  }
  tokenLiteral = () => {
    return this.token.literal
  }

  toString = () => {
    return this.value
  }
}

export class IntegerLiteral implements Expression {
  constructor(public token: Token, public value: number) {}

  expressionNode = () => {
    return this
  }
  tokenLiteral = () => {
    return this.token.literal
  }

  toString = () => {
    return String(this.value)
  }
}
