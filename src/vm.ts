import { readUint16, Instructions, Opcodes } from './code'
import { Bytecode } from './compiler'
import { BaseObject, BooleanObj, IntegerObj } from './object'

const STACK_SIZE = 2048

// reusable, comparable
const TRUE = new BooleanObj(true)
const FALSE = new BooleanObj(false)

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

  run = (): void => {
    for (
      let instructionPointer = 0;
      instructionPointer < this.instructions.length;
      instructionPointer++
    ) {
      const op = this.instructions[instructionPointer]

      switch (op) {
        case Opcodes.OpConstant: {
          const constIndex = readUint16(
            this.instructions.slice(instructionPointer + 1)
          )
          instructionPointer += 2
          this.push(this.constants[constIndex])
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
        case Opcodes.OpPop:
          this.pop()
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
