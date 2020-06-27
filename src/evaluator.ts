import {
  Node,
  IntegerLiteral,
  Program,
  ExpressionStatement,
  BoolExpression,
  PrefixExpression,
  InfixExpression,
  IfExpression,
  BlockStatement,
  ReturnStatement,
} from './ast'
import {
  IntegerObj,
  BooleanObj,
  NullObj,
  BaseObject,
  ReturnObj,
} from './object'

// CONSTANTS
// there's only ever 1 true/false, so we can reuse those objects

const TRUE = new BooleanObj(true)
const FALSE = new BooleanObj(false)
const NULL = new NullObj()

/// ###############################

/**
 * important so that we're always comparing the True Boolean Objects
 */
const convertExpressionToBooleanObj = (input: boolean): BooleanObj =>
  input ? TRUE : FALSE

const evalProgram = (program: Program): BaseObject => {
  let result: BaseObject = NULL

  for (const statement of program.statements) {
    result = evaluate(statement)

    if (result instanceof ReturnObj) {
      return result.value
    }
  }

  return result
}

const evalBlockStatement = (block: BlockStatement): BaseObject => {
  let result: BaseObject = NULL

  for (const statement of block.statements) {
    result = evaluate(statement)
    if (result instanceof ReturnObj) {
      return result
    }
  }

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

/**
 * if it's a number, turns it into a negative number
 */
const evalMinusPrefixOperatorExpression = (right: BaseObject): BaseObject => {
  if (!(right instanceof IntegerObj)) {
    return NULL
  }

  return new IntegerObj(-right.value)
}

const intOpFuncs: { [x: string]: (a: number, b: number) => number } = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
}

const boolOpFuncs: { [x: string]: (a: number, b: number) => boolean } = {
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
}

const evalIntegerInfixExpression = (
  left: IntegerObj,
  operator: string,
  right: IntegerObj
): BaseObject => {
  const leftVal = left.value
  const rightVal = right.value

  if (intOpFuncs[operator]) {
    return new IntegerObj(intOpFuncs[operator](leftVal, rightVal))
  }

  if (boolOpFuncs[operator]) {
    return convertExpressionToBooleanObj(
      boolOpFuncs[operator](leftVal, rightVal)
    )
  }

  return NULL
}

const evalInfixExpression = (
  left: BaseObject,
  operator: string,
  right: BaseObject
): BaseObject => {
  if (left instanceof IntegerObj && right instanceof IntegerObj) {
    return evalIntegerInfixExpression(left, operator, right)
  }

  // the assumption here is that if we get this far, we only have booleans
  if (operator === '==') {
    return convertExpressionToBooleanObj(left === right)
  }
  if (operator === '!=') {
    return convertExpressionToBooleanObj(left !== right)
  }
  return NULL
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

const isTruthy = (obj: BaseObject): boolean => {
  if (obj === NULL) {
    return false
  }
  if (obj === TRUE) {
    return true
  }
  if (obj === FALSE) {
    return false
  }
  return true
}

const evalIfExpression = (ie: IfExpression): BaseObject => {
  if (isTruthy(evaluate(ie.condition))) {
    return evaluate(ie.consequence)
  } else if (ie.alternative) {
    return evaluate(ie.alternative)
  }
  return NULL
}

export const evaluate = (node?: Node): BaseObject => {
  // statements
  if (node instanceof Program) {
    return evalProgram(node)
  }

  if (node instanceof ExpressionStatement) {
    return evaluate(node.expression)
  }

  if (node instanceof BlockStatement) {
    return evalBlockStatement(node)
  }

  if (node instanceof ReturnStatement) {
    return new ReturnObj(evaluate(node.returnValue))
  }

  // expressions
  if (node instanceof IntegerLiteral) {
    return new IntegerObj(node.value)
  }

  if (node instanceof BoolExpression) {
    return convertExpressionToBooleanObj(node.value)
  }

  if (node instanceof PrefixExpression) {
    return evalPrefixExpression(node.operator, evaluate(node.right))
  }

  if (node instanceof InfixExpression) {
    return evalInfixExpression(
      evaluate(node.left),
      node.operator,
      evaluate(node.right)
    )
  }

  if (node instanceof IfExpression) {
    return evalIfExpression(node)
  }

  return NULL
}
