import { TOKENS, Token } from './token'

interface Node {
  tokenLiteral: () => string
}

export interface Statement extends Node {
  statementNode: () => Node // for testing so we know we have the correct node
}

export interface Expression extends Node {
  expressionNode: () => Node // for testing so we know we have the correct node
}

export class Program {
  statements: Statement[] = []

  tokenLiteral() {
    if (this.statements.length) {
      return this.statements[0].tokenLiteral()
    } else {
      return ''
    }
  }
}

export class LetStatement implements Statement {
  token!: Token
  name!: Identifier
  value!: Expression

  statementNode() {
    return { tokenLiteral: () => '' }
  }
  tokenLiteral() {
    return this.token.literal
  }
}

export class Identifier implements Expression {
  token!: Token
  value: string

  constructor(value: string) {
    this.value = value
  }

  expressionNode() {
    return { tokenLiteral: () => '' }
  }
  tokenLiteral() {
    return this.token.literal
  }
}
