import { readUint16, Instructions, Opcodes } from './code'
import { Bytecode } from './compiler'
import {
  ArrayObj,
  BaseObject,
  BooleanObj,
  HashObj,
  HashPair,
  IntegerObj,
  NullObj,
  objIsHashable,
  StringObj,
} from './object'

const STACK_SIZE = 2048

// reusable, comparable
const TRUE = new BooleanObj(true)
const FALSE = new BooleanObj(false)
const NULL = new NullObj()

const nativeBoolToObj = (input: boolean): BooleanObj => (input ? TRUE : FALSE)

const isTruthy = (obj: BaseObject): boolean => {
  if (obj instanceof BooleanObj) {
    return obj.value
  }
  if (obj === NULL) {
    return false
  }

  return true
}

export class VM {
  private readonly constants: BaseObject[]
  private readonly instructions: Instructions
  private readonly stack: BaseObject[] = Array(STACK_SIZE)
  // always points to the next value. top of stack is stack[stackPointer - 1]
  private stackPointer: number = 0

  constructor(bytecode: Bytecode, public readonly globals: BaseObject[] = []) {
    this.instructions = bytecode.instructions // TODO: need to copy?
    this.constants = bytecode.constants // TODO: need to copy?
  }

  push = (o: BaseObject): void => {
    if (this.stackPointer >= STACK_SIZE) {
      throw new Error('stack overflow')
    }
    this.stack[this.stackPointer] = o
    this.stackPointer++
  }

  executeBinaryOperation = (op: Opcodes): void => {
    const right = this.pop()
    const left = this.pop()

    if (left instanceof IntegerObj && right instanceof IntegerObj) {
      return this.executeBinaryIntegerOperation(op, left, right)
    }

    if (left instanceof StringObj && right instanceof StringObj) {
      return this.executeBinaryStringOperation(op, left, right)
    }

    // TODO: add arrays together?

    throw new Error(
      `Unsupported types for binary operation: ${left.primitive} & ${right.primitive}`
    )
  }

  executeBinaryIntegerOperation = (
    op: Opcodes,
    left: IntegerObj,
    right: IntegerObj
  ): void => {
    let result: number

    switch (op) {
      case Opcodes.OpAdd:
        result = left.value + right.value
        break
      case Opcodes.OpSub:
        result = left.value - right.value
        break
      case Opcodes.OpMul:
        result = left.value * right.value
        break
      case Opcodes.OpDiv:
        result = left.value / right.value
        break
      default:
        throw new Error(`unknown integer operator: ${Opcodes[op]}`)
    }
    this.push(new IntegerObj(result))
  }

  executeBinaryStringOperation = (
    op: Opcodes,
    left: StringObj,
    right: StringObj
  ): void => {
    if (op !== Opcodes.OpAdd) {
      throw new Error(`unknown string operator: ${Opcodes[op]}`)
    }

    this.push(new StringObj(left.value + right.value))
  }

  executeIndexExpression = (left: BaseObject, index: BaseObject): void => {
    if (left instanceof ArrayObj && index instanceof IntegerObj) {
      return this.executeArrayIndex(left, index)
    }
    if (left instanceof HashObj) {
      return this.executeHashIndex(left, index)
    }
    throw new Error(`index operator not supported for type: ${left.primitive}`)
  }

  executeArrayIndex = (arr: ArrayObj, index: IntegerObj): void => {
    const maxIndex = arr.elements.length - 1
    const i = index.value
    if (i < 0 || i > maxIndex) {
      // * do bounds checking?
      this.push(NULL)
    } else {
      this.push(arr.elements[i])
    }
  }

  executeHashIndex = (hash: HashObj, index: BaseObject): void => {
    if (!objIsHashable(index)) {
      throw new Error(`unusable as hash key: ${index.primitive}`)
    }
    const pair = hash.pairs.get(index.hashKey())
    if (pair === undefined) {
      this.push(NULL)
    } else {
      this.push(pair.value)
    }
  }

  executeComparison = (op: Opcodes): void => {
    const right = this.pop()
    const left = this.pop()

    if (left instanceof IntegerObj && right instanceof IntegerObj) {
      return this.executeIntegerComparison(op, left, right)
    }

    switch (op) {
      case Opcodes.OpEqual:
        // direct comparison only works because TRUE and FALSE instances are used for every boolean
        this.push(nativeBoolToObj(left === right))
        break
      case Opcodes.OpNotEqual:
        this.push(nativeBoolToObj(left !== right))
        break
      default:
        throw new Error(
          `unknown operator: ${Opcodes[op]} for ${left.primitive} and ${right.primitive}`
        )
    }
  }

  executeIntegerComparison = (
    op: Opcodes,
    left: IntegerObj,
    right: IntegerObj
  ): void => {
    switch (op) {
      case Opcodes.OpEqual:
        this.push(nativeBoolToObj(left.value === right.value))
        break
      case Opcodes.OpNotEqual:
        this.push(nativeBoolToObj(left.value !== right.value))
        break
      case Opcodes.OpGreaterThan:
        this.push(nativeBoolToObj(left.value > right.value))
        break
      default:
        throw new Error(`unknown operator: ${Opcodes[op]}`)
    }
  }

  executeBangOperator = (): void => {
    // non BooleanObj also return false
    const operand = this.pop()
    this.push(operand === FALSE || operand === NULL ? TRUE : FALSE)
  }

  executeMinusOperator = (): void => {
    const operand = this.pop()

    if (!(operand instanceof IntegerObj)) {
      throw new Error(`unsupported type for negation: ${operand.primitive}`)
    }

    this.push(new IntegerObj(-operand.value))
  }

  buildArray = (startIndex: number, endIndex: number): BaseObject => {
    return new ArrayObj(this.stack.slice(startIndex, endIndex))
  }

  buildHash = (startIndex: number, endIndex: number): BaseObject => {
    const hashedPairs = new Map<string, HashPair>()

    for (let i = startIndex; i < endIndex; i += 2) {
      const key = this.stack[i]
      const value = this.stack[i + 1]
      const pair: HashPair = { key, value }
      if (objIsHashable(key)) {
        hashedPairs.set(key.hashKey(), pair)
      } else {
        throw new Error(`invalid type for hash key: ${key.primitive}`)
      }
    }

    return new HashObj(hashedPairs)
  }

  /**
   * read a single 16 bit argument
   */
  readArgument = (instructionPointer: number) =>
    readUint16(this.instructions.slice(instructionPointer + 1))

  run = (): void => {
    for (
      let instructionPointer = 0;
      instructionPointer < this.instructions.length;
      instructionPointer++
    ) {
      const op = this.instructions[instructionPointer]

      switch (op) {
        case Opcodes.OpConstant: {
          const constantObjIndex = this.readArgument(instructionPointer)
          instructionPointer += 2
          this.push(this.constants[constantObjIndex])
          break
        }
        case Opcodes.OpAdd:
        case Opcodes.OpSub:
        case Opcodes.OpMul:
        case Opcodes.OpDiv: {
          this.executeBinaryOperation(op)
          break
        }
        case Opcodes.OpTrue:
          this.push(TRUE)
          break
        case Opcodes.OpFalse:
          this.push(FALSE)
          break
        case Opcodes.OpNull:
          this.push(NULL)
          break
        case Opcodes.OpEqual:
        case Opcodes.OpNotEqual:
        case Opcodes.OpGreaterThan:
          this.executeComparison(op)
          break
        case Opcodes.OpPop:
          this.pop()
          break
        case Opcodes.OpBang:
          this.executeBangOperator()
          break
        case Opcodes.OpMinus:
          this.executeMinusOperator()
          break
        case Opcodes.OpJump: {
          const position = this.readArgument(instructionPointer)
          // set to 1 earlier so that we end up where we want to be when the loop runs
          instructionPointer = position - 1
          break
        }
        case Opcodes.OpJumpNotTruthy: {
          const position = this.readArgument(instructionPointer)
          instructionPointer += 2 // consume the argument no matter what

          const condition = this.pop()
          if (!isTruthy(condition)) {
            instructionPointer = position - 1
          }
          break
        }
        case Opcodes.OpSetGlobal: {
          const globalIndex = this.readArgument(instructionPointer)
          instructionPointer += 2
          this.globals[globalIndex] = this.pop()
          break
        }
        case Opcodes.OpGetGlobal: {
          const globalIndex = this.readArgument(instructionPointer)
          instructionPointer += 2
          this.push(this.globals[globalIndex])
          break
        }
        case Opcodes.OpArray: {
          const numElements = this.readArgument(instructionPointer)
          instructionPointer += 2
          const arr = this.buildArray(
            this.stackPointer - numElements,
            this.stackPointer
          )
          this.stackPointer -= numElements
          this.push(arr)
          break
        }
        case Opcodes.OpHash: {
          const numElements = this.readArgument(instructionPointer)
          instructionPointer += 2

          const hash = this.buildHash(
            this.stackPointer - numElements,
            this.stackPointer
          )
          this.stackPointer -= numElements

          this.push(hash)
          break
        }
        case Opcodes.OpIndex: {
          const index = this.pop()
          const left = this.pop()
          this.executeIndexExpression(left, index)
          break
        }
        default:
          break
      }
    }
  }

  pop = (): BaseObject => {
    if (this.stackPointer === 0) {
      throw new Error('Stack underflow, popped something off an empty stack')
    }
    this.stackPointer -= 1
    return this.stack[this.stackPointer]
  }

  // for tests only

  get lastPoppedStackElement(): BaseObject {
    return this.stack[this.stackPointer]
  }

  logStack = () => {
    console.log('vm stackPointer:', this.stackPointer)
    console.log('vm stack', this.stack)
  }
}
