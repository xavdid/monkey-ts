import {
  Node,
  IntegerLiteral,
  Statement,
  Program,
  ExpressionStatement,
} from './ast'
import { IntegerObj, Obj } from './object'

export const evaluate = (node: Node): Obj | undefined => {
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
}

export const evalStatements = (statements: Statement[]): Obj | undefined => {
  let result

  statements.forEach((statement) => {
    result = evaluate(statement)
  })

  return result
}
