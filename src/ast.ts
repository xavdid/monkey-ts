import { Token } from './token'

interface Node {
  token: Token
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
    return this.statements.map(String).join('')
  }
}

export class LetStatement implements Statement {
  constructor(
    public token: Token,
    public name: Identifier,
    public value?: Expression // optional because for now, we don't always pass a value in there
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

export class PrefixExpression implements Expression {
  constructor(
    public token: Token, // eg "!"
    public operator: string,
    public right?: Expression // added after initialization
  ) {}

  expressionNode = () => {
    return this
  }
  tokenLiteral = () => {
    return this.token.literal
  }

  toString = () => {
    return `(${this.operator}${this.right})`
  }
}

export class InfixExpression implements Expression {
  constructor(
    public token: Token, // eg "+"
    public left: Expression, // this might need to be optional, which would cause me to change this signature
    public operator: string,
    public right?: Expression // added after initialization
  ) {}

  expressionNode = () => {
    return this
  }
  tokenLiteral = () => {
    return this.token.literal
  }

  toString = () => {
    return `(${this.left} ${this.operator} ${this.right})`
  }
}

export class Bool implements Expression {
  constructor(
    public token: Token, // eg "+"
    public value: boolean
  ) {}

  expressionNode = () => {
    return this
  }
  tokenLiteral = () => {
    return this.token.literal
  }

  toString = () => {
    return this.token.literal
  }
}
