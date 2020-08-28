import { Token } from './token'

export interface Node {
  token?: Token
  tokenLiteral: () => string | undefined
  toString: () => string
  clone: () => Node
}

// not sure I even need these since they're the same
export type Statement = Node

export type Expression = Node

abstract class BaseNode implements Node {
  abstract token: Token
  abstract toString: () => string
  // this is always defined, but whatever
  tokenLiteral = () => this.token?.literal ?? ''
  abstract clone: () => Node
}

export class Program implements Node {
  constructor(public statements: Statement[] = []) {}

  tokenLiteral = () => {
    if (this.statements.length) {
      return this.statements[0].tokenLiteral()
    } else {
      return ''
    }
  }

  toString = () => this.statements.map(String).join('')

  clone() {
    console.log('do not clone a program??')
    return new Program()
  }
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

  clone = () =>
    new LetStatement(this.token.clone(), this.name.clone(), this.value.clone())
}

export class ReturnStatement extends BaseNode implements Statement {
  constructor(public token: Token, public returnValue?: Expression) {
    super()
  }

  toString = () =>
    `${this.tokenLiteral()} ${this.returnValue ? this.returnValue : ''};`

  clone = () =>
    new ReturnStatement(this.token.clone(), this.returnValue?.clone())
}

export class ExpressionStatement extends BaseNode implements Statement {
  constructor(public token: Token, public expression: Expression) {
    super()
  }

  toString = () => String(this.expression)

  clone = () =>
    new ExpressionStatement(this.token.clone(), this.expression.clone())
}

export class Identifier extends BaseNode implements Expression {
  constructor(public token: Token, public value: string) {
    super()
  }

  toString = () => this.value

  clone = () => new Identifier(this.token.clone(), this.value)
}

export class IntegerLiteral extends BaseNode implements Expression {
  constructor(public token: Token, public value: number) {
    super()
  }

  toString = () => String(this.value)
  clone = () => new IntegerLiteral(this.token.clone(), this.value)
}

export class PrefixExpression extends BaseNode implements Expression {
  constructor(
    public token: Token, // eg "!"
    public operator: string,
    public right: Expression // added after initialization
  ) {
    super()
  }

  toString = () => `(${this.operator}${this.right})`

  clone = () =>
    new PrefixExpression(this.token.clone(), this.operator, this.right.clone())
}

export class InfixExpression extends BaseNode implements Expression {
  constructor(
    public token: Token, // eg "+"
    public left: Expression,
    public operator: string,
    public right: Expression // added after initialization
  ) {
    super()
  }

  toString = () => `(${this.left} ${this.operator} ${this.right})`

  clone = () =>
    new InfixExpression(
      this.token.clone(),
      this.left.clone(),
      this.operator,
      this.right.clone()
    )
}

export class BooleanLiteral extends BaseNode implements Expression {
  constructor(
    public token: Token, // eg "+"
    public value: boolean
  ) {
    super()
  }

  toString = () => {
    return this.token.literal
  }

  clone = () => new BooleanLiteral(this.token.clone(), this.value)
}

export class BlockStatement extends BaseNode implements Statement {
  constructor(public token: Token, public statements: Statement[]) {
    super()
  }

  toString = () => this.statements.map(String).join('')
  clone = () =>
    new BlockStatement(
      this.token.clone(),
      this.statements.map((x) => x.clone())
    )
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

  clone = () =>
    new IfExpression(
      this.token.clone(),
      this.condition.clone(),
      this.consequence.clone(),
      this.alternative?.clone()
    )
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

  clone = () =>
    new FunctionLiteral(
      this.token.clone(),
      this.parameters.map((x) => x.clone()),
      this.body.clone()
    )
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
  clone = () =>
    new CallExpression(
      this.token.clone(),
      this.func.clone(),
      this.args.map((x) => x.clone())
    )
}

export class StringLiteral extends BaseNode implements Expression {
  constructor(public token: Token, public value: string) {
    super()
  }

  toString = () => this.token.literal
  clone = () => new StringLiteral(this.token.clone(), this.value)
}

export class ArrayLiteral extends BaseNode implements Expression {
  constructor(
    public token: Token, // "["
    public elements: Expression[]
  ) {
    super()
  }

  toString = () => `[${this.elements.map((e) => e.toString()).join(', ')}]`
  clone = () =>
    new ArrayLiteral(
      this.token.clone(),
      this.elements.map((x) => x.clone())
    )
}

export class IndexExpression extends BaseNode implements Expression {
  constructor(
    public token: Token, // "["
    public left: Expression,
    public index: Expression
  ) {
    super()
  }

  toString = () => `(${this.left.toString()}[${this.index.toString()}])`
  clone = () =>
    new IndexExpression(
      this.token.clone(),
      this.left.clone(),
      this.index.clone()
    )
}

export class HashLiteral extends BaseNode implements Expression {
  constructor(
    public token: Token, // "{"
    public pairs: Map<Expression, Expression>
  ) {
    super()
  }

  toString = () =>
    `
    {
      ${[...this.pairs]
        .map(([key, value]) => `${key.toString()}:${value.toString()}`)
        .join(', ')}
    }
  `.trim()

  clone = () =>
    new HashLiteral(
      this.token,
      new Map(
        [...this.pairs].map(([key, value]) => [key.clone(), value.clone()])
      )
    )
}

type ModifierFunc = (node: Node) => Node

export const modify = (node: Node, modifier: ModifierFunc): Node => {
  if (node instanceof Program) {
    node.statements = node.statements.map((statement) => {
      return modify(statement, modifier)
    })
  }
  if (node instanceof ExpressionStatement) {
    node.expression = modify(node.expression, modifier) as ExpressionStatement
  }
  if (node instanceof InfixExpression) {
    node.left = modifier(node.left)
    node.right = modifier(node.right)
  }
  if (node instanceof IndexExpression) {
    node.left = modifier(node.left)
    node.index = modifier(node.index)
  }
  if (node instanceof PrefixExpression) {
    node.right = modifier(node.right)
  }
  return modifier(node)
}
