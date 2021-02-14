import { readUint16, Instructions, Opcodes } from './code'
import { Bytecode } from './compiler'
import { BaseObject, BooleanObj, IntegerObj } from './object'

const STACK_SIZE = 2048

// reusable, comparable
const TRUE = new BooleanObj(true)
const FALSE = new BooleanObj(false)

const nativeBoolToObj = (input: boolean): BooleanObj => (input ? TRUE : FALSE)

export class VM {
  private readonly constants: BaseObject[]
  private readonly instructions: Instructions
  private readonly stack: BaseObject[] = Array(STACK_SIZE)
  // always points to the next value. top of stack is stack[stackPointer - 1]
  private stackPointer: number = 0
  constructor(bytecode: Bytecode) {
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
    this.push(this.pop() === FALSE ? TRUE : FALSE)
  }

  executeMinusOperator = (): void => {
    const operand = this.pop()

    if (!(operand instanceof IntegerObj)) {
      throw new Error(`unsupported type for negation: ${operand.primitive}`)
    }

    this.push(new IntegerObj(-operand.value))
  }

  run = (): void => {
    for (
      let instructionPointer = 0;
      instructionPointer < this.instructions.length;
      instructionPointer++
    ) {
      const op = this.instructions[instructionPointer]

      switch (op) {
        case Opcodes.OpConstant: {
          const constantObjIndex = readUint16(
            this.instructions.slice(instructionPointer + 1)
          )
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
        default:
          break
      }
    }
  }

  pop = (): BaseObject => {
    if (this.stackPointer === 0) {
      throw new Error('Stack underflow, popped something off an empty stack')
    }
    const o = this.stack[this.stackPointer - 1]
    this.stackPointer--
    return o
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
