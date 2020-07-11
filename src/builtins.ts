import {
  BuiltinFuncObj,
  // NullObj,
  ErrorObj,
  StringObj,
  IntegerObj,
} from './object'
// can't import from evaluator

const builtinFuncs: { [x: string]: BuiltinFuncObj } = {
  len: new BuiltinFuncObj((...args) => {
    if (args.length !== 1) {
      return new ErrorObj(
        `wrong number of arguments. got=${args.length}, want=1`
      )
    }
    const arg = args[0]
    if (arg instanceof StringObj) {
      return new IntegerObj(arg.value.length)
    }
    return new ErrorObj(
      `argument to \`len\` not supported, got ${arg.primitive}`
    )
  }),
}

export default builtinFuncs
