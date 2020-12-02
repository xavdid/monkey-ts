import { readUint16, Instructions, Opcodes } from './code'
import { Bytecode } from './compiler'
import { BaseObject, IntegerObj } from './object'

const STACK_SIZE = 2048

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

  stackTop = (): BaseObject | undefined => {
    if (this.stackPointer === 0) {
      return undefined
    }
    return this.stack[this.stackPointer - 1]
  }

  push = (o: BaseObject): void => {
    if (this.stackPointer >= STACK_SIZE) {
      throw new Error('stack overflow')
    }
    this.stack[this.stackPointer] = o
    this.stackPointer++
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
        case Opcodes.OpAdd: {
          const right = this.pop() as IntegerObj
          const left = this.pop() as IntegerObj

          const result = left.value + right.value
          this.push(new IntegerObj(result))
          break
        }
        default:
          break
      }
    }
  }

  pop = (): BaseObject => {
    const o = this.stack[this.stackPointer - 1]
    this.stackPointer--
    return o
  }

  logStack = () => {
    console.log('vm stackPointer:', this.stackPointer)
    console.log('vm stack', this.stack)
  }
}
