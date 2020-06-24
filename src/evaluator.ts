import {
  Node,
  IntegerLiteral,
  Statement,
  Program,
  ExpressionStatement,
  BoolExpression,
} from './ast'
import { IntegerObj, BooleanObj, NullObj, BaseObject } from './object'

// CONSTANTS
// there's only ever 1 true/false, so we can reuse those objects

const TRUE = new BooleanObj(true)
const FALSE = new BooleanObj(false)
const NULL = new NullObj()

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
  return NULL
}

export const evalStatements = (statements: Statement[]): BaseObject => {
  let result: BaseObject = NULL

  statements.forEach((statement) => {
    result = evaluate(statement)
  })

  return result
}
