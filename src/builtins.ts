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
  return new ErrorObj(`argument to "len" not supported, got ${arg.primitive}`)
})

const putFunc = new BuiltinFuncObj((...args) => {
  args.forEach((arg) => {
    console.log(arg.toString())
  })
  return NULL
})

// these are both so similar, I figured I'd make a generic version
const generateArrayBuiltinFunc = (
  name: string,
  operation: (elements: BaseObject[], input?: BaseObject) => BaseObject,
  { expectedArgs = 1, canActOnEmptyArrays = false } = {}
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

    if (!canActOnEmptyArrays && arr.elements.length === 0) {
      return NULL
    }

    return operation(arr.elements, arg)
  })

const builtinFuncs: { [x: string]: BuiltinFuncObj } = {
  len: lenFunc,
  first: generateArrayBuiltinFunc('first', (elements) => elements[0]),
  last: generateArrayBuiltinFunc(
    'last',
    (elements) => elements[elements.length - 1]
  ),
  rest: generateArrayBuiltinFunc(
    'rest',
    (elements) => new ArrayObj(elements.slice(1).map((x) => x.clone()))
  ),
  push: generateArrayBuiltinFunc(
    'push',
    (elements, arg) => {
      return new ArrayObj([...elements.map((x) => x.clone()), arg!])
    },
    { expectedArgs: 2, canActOnEmptyArrays: true }
  ),
  puts: putFunc,
}

export default builtinFuncs
