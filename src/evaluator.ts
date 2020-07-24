import {
  Node,
  IntegerLiteral,
  Program,
  ExpressionStatement,
  BooleanLiteral,
  PrefixExpression,
  InfixExpression,
  IfExpression,
  BlockStatement,
  ReturnStatement,
  LetStatement,
  Identifier,
  FunctionLiteral,
  CallExpression,
  Expression,
  StringLiteral,
  ArrayLiteral,
  IndexExpression,
} from './ast'
import {
  IntegerObj,
  BooleanObj,
  BaseObject,
  ReturnObj,
  ErrorObj,
  FunctionObj,
  StringObj,
  BuiltinFuncObj,
  ArrayObj,
  TRUE,
  FALSE,
  NULL,
} from './object'
import { Environment } from './environment'
import builtinFuncs from './builtins'

/// ###############################

/**
 * important so that we're always comparing the True Boolean Objects
 */
const convertExpressionToBooleanObj = (input: boolean): BooleanObj =>
  input ? TRUE : FALSE

const evalProgram = (program: Program, env: Environment): BaseObject => {
  let result: BaseObject = NULL

  for (const statement of program.statements) {
    result = evaluate(statement, env)

    if (result instanceof ReturnObj) {
      return result.value
    }
    if (result instanceof ErrorObj) {
      return result
    }
  }

  return result
}

const evalBlockStatement = (
  block: BlockStatement,
  env: Environment
): BaseObject => {
  let result: BaseObject = NULL

  for (const statement of block.statements) {
    result = evaluate(statement, env)
    if (result instanceof ReturnObj || result instanceof ErrorObj) {
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
    return new ErrorObj(`unknown operator: -${right.primitive}`)
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

  return new ErrorObj(
    `unknown operator: ${left.primitive} ${operator} ${right.primitive}`
  )
}

const evalStringInfixExpression = (
  left: StringObj,
  operator: string,
  right: StringObj
): BaseObject => {
  if (operator !== '+') {
    return new ErrorObj(
      `unknown operator: ${left.primitive} ${operator} ${right.primitive}`
    )
  }

  return new StringObj(`${left.toString()}${right.toString()}`)
}

const evalInfixExpression = (
  left: BaseObject,
  operator: string,
  right: BaseObject
): BaseObject => {
  if (left instanceof IntegerObj && right instanceof IntegerObj) {
    return evalIntegerInfixExpression(left, operator, right)
  }

  if (left instanceof StringObj && right instanceof StringObj) {
    return evalStringInfixExpression(left, operator, right)
  }

  // the assumption here is that if we get this far, we only have booleans
  if (operator === '==') {
    return convertExpressionToBooleanObj(left === right)
  }
  if (operator === '!=') {
    return convertExpressionToBooleanObj(left !== right)
  }
  if (left.primitive !== right.primitive) {
    return new ErrorObj(
      `type mismatch: ${left.primitive} ${operator} ${right.primitive}`
    )
  }
  return new ErrorObj(
    `unknown operator: ${left.primitive} ${operator} ${right.primitive}`
  )
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
  return new ErrorObj(`unknown operator: ${operator}${right.primitive}`)
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

const evalIfExpression = (ie: IfExpression, env: Environment): BaseObject => {
  const condition = evaluate(ie.condition, env)
  if (isError(condition)) {
    return condition
  }
  if (isTruthy(condition)) {
    return evaluate(ie.consequence, env)
  } else if (ie.alternative) {
    return evaluate(ie.alternative, env)
  }
  return NULL
}

const evalIdentifier = (node: Identifier, env: Environment): BaseObject => {
  const val = env.get(node.value)
  if (val) {
    return val
  }

  if (builtinFuncs[node.value]) {
    return builtinFuncs[node.value]
  }

  return new ErrorObj(`identifier not found: ${node.value}`)
}

const evalExpressions = (
  exps: Expression[],
  env: Environment
): BaseObject[] => {
  // might need to have a copy of the original env here? if we think args could modify state
  const result = []
  for (const exp of exps) {
    const evaluated = evaluate(exp, env)
    if (isError(evaluated)) {
      return [evaluated]
    }
    result.push(evaluated)
  }
  return result
}

const unwrapReturnValue = (obj: BaseObject): BaseObject => {
  if (obj instanceof ReturnObj) {
    return obj.value
  }

  return obj
}

const extendFunctionEnv = (
  func: FunctionObj,
  args: BaseObject[]
): Environment => {
  const env = new Environment(func.env)

  func.parameters.forEach((arg, i) => {
    env.set(arg.value, args[i])
  })

  return env
}

const applyFunction = (func: BaseObject, args: BaseObject[]): BaseObject => {
  if (func instanceof FunctionObj) {
    const extnededEnv = extendFunctionEnv(func, args)
    const evaluated = evaluate(func.body, extnededEnv)
    return unwrapReturnValue(evaluated)
  }

  if (func instanceof BuiltinFuncObj) {
    return func.func(...args)
  }

  return new ErrorObj(`not a function: ${func.primitive}`)
}

const evalArrayIndexExpression = (
  arr: ArrayObj,
  index: IntegerObj
): BaseObject => {
  if (index.value < 0 || index.value >= arr.elements.length) {
    return NULL
  }
  return arr.elements[index.value]
}

const evalIndexExpression = (
  left: BaseObject,
  index: BaseObject
): BaseObject => {
  if (left instanceof ArrayObj && index instanceof IntegerObj) {
    return evalArrayIndexExpression(left, index)
  }
  return new ErrorObj(`index operator not supported: ${left.primitive}`)
}

export const evaluate = (
  node: Node | undefined,
  env: Environment
): BaseObject => {
  // statements
  if (node instanceof Program) {
    return evalProgram(node, env)
  }

  if (node instanceof ExpressionStatement) {
    return evaluate(node.expression, env)
  }

  if (node instanceof BlockStatement) {
    return evalBlockStatement(node, env)
  }

  if (node instanceof ReturnStatement) {
    const val = evaluate(node.returnValue, env)
    return isError(val) ? val : new ReturnObj(val)
  }

  // expressions
  if (node instanceof IntegerLiteral) {
    return new IntegerObj(node.value)
  }

  if (node instanceof BooleanLiteral) {
    return convertExpressionToBooleanObj(node.value)
  }

  if (node instanceof PrefixExpression) {
    const right = evaluate(node.right, env)
    if (isError(right)) {
      return right
    }
    return evalPrefixExpression(node.operator, right)
  }

  if (node instanceof InfixExpression) {
    const left = evaluate(node.left, env)
    if (isError(left)) {
      return left
    }
    const right = evaluate(node.right, env)
    if (isError(right)) {
      return right
    }

    return evalInfixExpression(left, node.operator, right)
  }

  if (node instanceof IfExpression) {
    return evalIfExpression(node, env)
  }

  if (node instanceof LetStatement) {
    const val = evaluate(node.value, env)
    if (isError(val)) {
      return val
    }
    env.set(node.name.value, val)
    return NULL
  }

  if (node instanceof Identifier) {
    return evalIdentifier(node, env)
  }

  if (node instanceof FunctionLiteral) {
    return new FunctionObj(node.parameters, node.body, env)
  }

  if (node instanceof CallExpression) {
    const func = evaluate(node.func, env)
    if (isError(func)) {
      return func
    }
    const args = evalExpressions(node.args, env)
    if (isError(args[0])) {
      // need to check arg length here?
      return args[0]
    }
    return applyFunction(func, args)
  }

  if (node instanceof StringLiteral) {
    return new StringObj(node.value)
  }

  if (node instanceof ArrayLiteral) {
    const elements = evalExpressions(node.elements, env)
    if (isError(elements[0])) {
      // need to check arg length here?
      return elements[0]
    }
    return new ArrayObj(elements)
  }

  if (node instanceof IndexExpression) {
    const left = evaluate(node.left, env)
    if (isError(left)) {
      return left
    }
    const index = evaluate(node.index, env)
    if (isError(index)) {
      return index
    }
    return evalIndexExpression(left, index)
  }

  return NULL
}

export const isError = (obj: BaseObject): boolean => obj instanceof ErrorObj
