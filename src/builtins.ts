import {
  BuiltinFuncObj,
  ErrorObj,
  StringObj,
  IntegerObj,
  ArrayObj,
  BaseObject,
} from './object'

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
      return undefined
    }

    return operation(arr.elements, arg)
  })

// store these as an array so we can iterate stably
// not sure why yet
const builtins: Array<{ name: string; func: BuiltinFuncObj }> = [
  {
    name: 'len',
    func: new BuiltinFuncObj((...args) => {
      if (args.length !== 1) {
        return new ErrorObj(
          `wrong number of arguments. got=${args.length}, want=1`
        )
      }
      const arg = args[0]
      if (arg instanceof StringObj) {
        return new IntegerObj(arg.value.length)
      }
      if (arg instanceof ArrayObj) {
        return new IntegerObj(arg.elements.length)
      }
      return new ErrorObj(
        `argument to "len" not supported, got ${arg.primitive}`
      )
    }),
  },
  {
    name: 'puts',
    func: new BuiltinFuncObj((...args) => {
      args.forEach((arg) => {
        console.log(arg.toString())
      })
      // instead of returning our NULL singleton, returning `undefined` lets us use this in multiple places
      return undefined
    }),
  },
  {
    name: 'first',
    func: generateArrayBuiltinFunc('first', (elements) => elements[0]),
  },
  {
    name: 'last',
    func: generateArrayBuiltinFunc(
      'last',
      (elements) => elements[elements.length - 1]
    ),
  },
  {
    name: 'rest',
    func: generateArrayBuiltinFunc(
      'rest',
      (elements) => new ArrayObj(elements.slice(1).map((x) => x.clone()))
    ),
  },
  {
    name: 'push',
    func: generateArrayBuiltinFunc(
      'push',
      (elements, arg) => {
        return new ArrayObj([...elements.map((x) => x.clone()), arg!])
      },
      { expectedArgs: 2, canActOnEmptyArrays: true }
    ),
  },
]

// TODO: string here is actually one of the func names in `builtins` above
// can _maybe_ map over the array
const getBuiltinByName = (builtinName: string): BuiltinFuncObj | undefined => {
  const found = builtins.find(({ name }) => name === builtinName)
  if (found) {
    return found.func
  }
}

// don't need the ! if nothing else uses this
const builtinFuncs: { [x: string]: BuiltinFuncObj } = {
  len: getBuiltinByName('len')!,
  first: getBuiltinByName('first')!,
  last: getBuiltinByName('last')!,
  rest: getBuiltinByName('rest')!,
  push: getBuiltinByName('push')!,
  puts: getBuiltinByName('puts')!,
}

export default builtinFuncs
