import { Token } from './token'

export interface Node {
  token?: Token
  tokenLiteral: () => string | undefined
  toString: () => string
}

// not sure I even need these since they're the same
export type Statement = Node

export type Expression = Node

abstract class BaseNode implements Node {
  token?: Token
  abstract toString: () => string
  // this is always defined, but whatever
  tokenLiteral = () => this.token?.literal ?? ''
}

export class Program implements Node {
  statements: Statement[] = []

  tokenLiteral = () => {
    if (this.statements.length) {
      return this.statements[0].tokenLiteral()
    } else {
      return ''
    }
  }

  toString = () => this.statements.map(String).join('')
}

export class LetStatement extends BaseNode implements Statement {
  constructor(
    public token: Token,
    public name: Identifier,
    public value: Expression // TODO: optional because for now, we don't always pass a value in there
  ) {
    super()
  }

  toString = () =>
    `${this.tokenLiteral()} ${this.name} = ${this.value ? this.value : ''};`
}

export class ReturnStatement extends BaseNode implements Statement {
  constructor(public token: Token, public returnValue?: Expression) {
    super()
  }

  toString = () =>
    `${this.tokenLiteral()} ${this.returnValue ? this.returnValue : ''};`
}

export class ExpressionStatement extends BaseNode implements Statement {
  constructor(public token: Token, public expression: Expression) {
    super()
  }

  toString = () => String(this.expression)
}

export class Identifier extends BaseNode implements Expression {
  constructor(public token: Token, public value: string) {
    super()
  }

  toString = () => this.value
}

export class IntegerLiteral extends BaseNode implements Expression {
  constructor(public token: Token, public value: number) {
    super()
  }

  toString = () => String(this.value)
}

export class PrefixExpression extends BaseNode implements Expression {
  constructor(
    public token: Token, // eg "!"
    public operator: string,
    public right?: Expression // added after initialization
  ) {
    super()
  }

  toString = () => `(${this.operator}${this.right})`
}

export class InfixExpression extends BaseNode implements Expression {
  constructor(
    public token: Token, // eg "+"
    public left: Expression,
    public operator: string,
    public right?: Expression // added after initialization
  ) {
    super()
  }

  toString = () => `(${this.left} ${this.operator} ${this.right})`
}

export class BoolExpression extends BaseNode implements Expression {
  constructor(
    public token: Token, // eg "+"
    public value: boolean
  ) {
    super()
  }

  toString = () => {
    return this.token.literal
  }
}

export class BlockStatement extends BaseNode implements Statement {
  constructor(public token: Token, public statements: Statement[]) {
    super()
  }

  tokenLiteral = () => {
    return this.token.literal
  }

  toString = () => this.statements.map(String).join('')
}

export class IfExpression extends BaseNode implements Expression {
  constructor(
    public token: Token, // "if"
    public condition: Expression,
    public consequence: BlockStatement,
    public alternative?: BlockStatement
  ) {
    super()
  }

  toString = () =>
    `if ${this.condition} ${this.consequence}${
      this.alternative ? ` else ${this.alternative}` : ''
    }`
}

export class FunctionLiteral extends BaseNode implements Expression {
  constructor(
    public token: Token, // "fn"
    public parameters: Identifier[],
    public body: BlockStatement
  ) {
    super()
  }

  toString = () =>
    `${this.tokenLiteral()}(${this.parameters.join(', ')})(${this.body})`
}

export class CallExpression extends BaseNode implements Expression {
  constructor(
    public token: Token, // "("
    public func: Expression,
    public args: Expression[]
  ) {
    super()
  }

  toString = () => `${this.func}(${this.args.join(', ')})`
}
