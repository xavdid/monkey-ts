import {
  Node,
  IntegerLiteral,
  Statement,
  Program,
  ExpressionStatement,
  BoolExpression,
  PrefixExpression,
} from './ast'
import {
  IntegerObj,
  BooleanObj,
  NullObj,
  BaseObject,
  ObjectType,
} from './object'

// CONSTANTS
// there's only ever 1 true/false, so we can reuse those objects

const TRUE = new BooleanObj(true)
const FALSE = new BooleanObj(false)
const NULL = new NullObj()

export const evalStatements = (statements: Statement[]): BaseObject => {
  let result: BaseObject = NULL

  statements.forEach((statement) => {
    result = evaluate(statement)
  })

  return result
}

/**
 * negates the input object
 */
const evalBangOperatorExpression = (right: BaseObject): BaseObject => {
  // this only works because we're re-using the boolean and null instances
  if (right === TRUE) {
    return FALSE
  }
  if (right === FALSE) {
    return TRUE
  }
  if (right === NULL) {
    return TRUE
  }
  return FALSE
}

const evalMinusPrefixOperatorExpression = (right: BaseObject): BaseObject => {
  if (!(right instanceof IntegerObj)) {
    return NULL
  }

  return new IntegerObj(-right.value)
}

const evalPrefixExpression = (
  operator: string,
  right: BaseObject
): BaseObject => {
  if (operator === '!') {
    return evalBangOperatorExpression(right)
  }
  if (operator === '-') {
    return evalMinusPrefixOperatorExpression(right)
  }
  return NULL
}

export const evaluate = (node: Node): BaseObject => {
  // statements
  if (node instanceof Program) {
    return evalStatements(node.statements)
  }

  if (node instanceof ExpressionStatement) {
    return evaluate(node.expression)
  }

  // expressions
  if (node instanceof IntegerLiteral) {
    return new IntegerObj(node.value)
  }

  if (node instanceof BoolExpression) {
    return node.value ? TRUE : FALSE
  }

  if (node instanceof PrefixExpression) {
    const right = evaluate(node.right)
    return evalPrefixExpression(node.operator, right)
  }
  return NULL
}
