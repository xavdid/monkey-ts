import {
  BuiltinFuncObj,
  ErrorObj,
  StringObj,
  IntegerObj,
  ArrayObj,
  NULL,
  BaseObject,
} from './object'

const lenFunc = new BuiltinFuncObj((...args) => {
  if (args.length !== 1) {
    return new ErrorObj(`wrong number of arguments. got=${args.length}, want=1`)
  }
  const arg = args[0]
  if (arg instanceof StringObj) {
    return new IntegerObj(arg.value.length)
  }
  if (arg instanceof ArrayObj) {
    return new IntegerObj(arg.elements.length)
  }
  return new ErrorObj(`argument to \`len\` not supported, got ${arg.primitive}`)
})

// these are both so similar, I figured I'd make a generic version
const generateArrayBuiltinFunc = (
  name: string,
  operation: (elements: BaseObject[], input?: BaseObject) => BaseObject,
  expectedArgs: number = 1
): BuiltinFuncObj =>
  new BuiltinFuncObj((...args) => {
    if (args.length !== expectedArgs) {
      return new ErrorObj(
        `wrong number of arguments. got=${args.length}, want=${expectedArgs}`
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [arr, arg, ...ignored] = args
    if (!(arr instanceof ArrayObj)) {
      return new ErrorObj(
        `argument to "${name}" must be ARRAY, got ${arr.primitive}`
      )
    }
    if (arr.elements.length > 0) {
      return operation(arr.elements, arg)
    }
    return NULL
  })

const builtinFuncs: { [x: string]: BuiltinFuncObj } = {
  len: lenFunc,
  first: generateArrayBuiltinFunc('first', (arr) => arr[0]),
  last: generateArrayBuiltinFunc('last', (arr) => arr[arr.length - 1]),
  rest: generateArrayBuiltinFunc(
    'rest',
    (arr) => new ArrayObj(arr.slice(1).map((x) => x.clone()))
  ),
  push: generateArrayBuiltinFunc(
    'push',
    (arr, arg) => {
      return new ArrayObj([...arr.map((x) => x.clone()), arg!])
    },
    2
  ),
}

export default builtinFuncs
