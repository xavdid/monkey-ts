import { Lexer } from '../lexer'
import { Parser } from '../parser'

import { evaluate } from '../evaluator'
import {
  ErrorObj,
  StringObj,
  BaseObject,
  IntegerObj,
  BooleanObj,
  ArrayObj,
  NullObj,
} from '../object'
import { Environment } from '../environment'
import { Program } from '../ast'

export const parseProgram = (input: string): Program => {
  const l = new Lexer(input)
  const p = new Parser(l)
  return p.parseProgram()
}

export const testEval = (input: string) => {
  const program = parseProgram(input)
  const env = new Environment()

  return evaluate(program, env)
}

// can't figure out how to type the binded function
// `_testObjType.bind<number>(null, IntegerObj)` gives "expected 1 arg, got two"
const _testObjType: (
  objType: new (args: any) => BaseObject,
  obj: BaseObject,
  value: number | string | boolean | null
) => void = (objType, obj, value) => {
  expect(obj).toBeInstanceOf(objType)
  expect(obj.value).toEqual(value)
}
export const testIntegerObj = _testObjType.bind(null, IntegerObj)
export const testStringObj = _testObjType.bind(null, StringObj)
export const testBooleanObj = _testObjType.bind(null, BooleanObj)
export const testNullObj = _testObjType.bind(null, NullObj)

export const testNumberArray = (obj: ArrayObj, value: number[]) => {
  expect(obj).toBeInstanceOf(ArrayObj)
  expect(obj.elements).toHaveLength(value.length)
  obj.elements.forEach((int, idx) => {
    testIntegerObj(int, value[idx])
  })
}

export const testErrorObj = (output: BaseObject, expected: string) => {
  expect(output).toBeInstanceOf(ErrorObj)
  expect(output.toString()).toEqual(expected)
}
