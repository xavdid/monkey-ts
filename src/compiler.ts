import {
  BlockStatement,
  BooleanLiteral,
  ExpressionStatement,
  IfExpression,
  InfixExpression,
  IntegerLiteral,
  Node,
  PrefixExpression,
  Program,
} from './ast'
import { Instructions, make, Opcodes, stringifyInstructions } from './code'
import { BaseObject, IntegerObj } from './object'

class EmittedInstruction {
  constructor(
    public readonly opcode: Opcodes,
    public readonly position: number
  ) {}
}

export class Bytecode {
  constructor(
    public instructions: Instructions,
    public constants: BaseObject[]
  ) {}

  toString(): string {
    return [
      '<BYTECODE>',
      'instructions:',
      ...stringifyInstructions(this.instructions)
        .split('\n')
        .map((i) => `\t${i}`),
      'constants:',
      ...this.constants.map((c) => `\t${c}`),
    ].join('\n')
  }
}

export class Compiler {
  private instructions: Instructions = []
  private readonly constants: any[] = []

  // most recently emitted
  lastInstruction?: EmittedInstruction
  // the one before last
  previousInstruction?: EmittedInstruction

  compile = (node: Node): void => {
    if (node instanceof Program) {
      node.statements.forEach(this.compile)
    } else if (node instanceof ExpressionStatement) {
      this.compile(node.expression)
      this.emit(Opcodes.OpPop)
    } else if (node instanceof PrefixExpression) {
      this.compile(node.right)

      switch (node.operator) {
        case '!':
          this.emit(Opcodes.OpBang)
          break
        case '-':
          this.emit(Opcodes.OpMinus)
          break
        default:
          throw new Error(`unknown prefix operator: ${node.operator}`)
      }
    } else if (node instanceof InfixExpression) {
      // special case because we need to reverse the sides
      if (node.operator === '<') {
        this.compile(node.right)
        this.compile(node.left)
        this.emit(Opcodes.OpGreaterThan)
        return
      }

      this.compile(node.left)
      this.compile(node.right)

      switch (node.operator) {
        case '+':
          this.emit(Opcodes.OpAdd)
          break
        case '-':
          this.emit(Opcodes.OpSub)
          break
        case '*':
          this.emit(Opcodes.OpMul)
          break
        case '/':
          this.emit(Opcodes.OpDiv)
          break
        case '>':
          this.emit(Opcodes.OpGreaterThan)
          break
        case '==':
          this.emit(Opcodes.OpEqual)
          break
        case '!=':
          this.emit(Opcodes.OpNotEqual)
          break
        default:
          throw new Error(`unknown infix operator: "${node.operator}"`)
      }
    } else if (node instanceof IntegerLiteral) {
      const int = new IntegerObj(node.value)
      this.emit(Opcodes.OpConstant, this.addConstant(int))
    } else if (node instanceof BooleanLiteral) {
      this.emit(node.value ? Opcodes.OpTrue : Opcodes.OpFalse)
    } else if (node instanceof IfExpression) {
      this.compile(node.condition)

      // emit a JNE with a bogus value we'll change later
      const jumpNotTruthyPos = this.emit(Opcodes.OpJumpNotTruthy, 9999)

      this.compile(node.consequence)

      if (this.isLastInstructionPop) {
        this.removeLastPop()
      }

      const afterConsequencePos = this.instructions.length
      this.changeOperand(jumpNotTruthyPos, afterConsequencePos)
    } else if (node instanceof BlockStatement) {
      node.statements.forEach(this.compile)
    }
  }

  emit = (op: Opcodes, ...operands: number[]): number => {
    const instruction = make(op, ...operands)
    const position = this.addInstruction(instruction)

    this.setLastInstruction(op, position)

    return position
  }

  setLastInstruction = (op: Opcodes, pos: number): void => {
    const previous = this.lastInstruction
    const last = new EmittedInstruction(op, pos)

    this.previousInstruction = previous
    this.lastInstruction = last
  }

  addInstruction = (instruction: number[]): number => {
    const newInstructionPosition = this.instructions.length
    this.instructions.push(...instruction)
    return newInstructionPosition
  }

  addConstant = (obj: BaseObject): number => {
    this.constants.push(obj)
    return this.constants.length - 1
  }

  get isLastInstructionPop(): boolean {
    return this.lastInstruction?.opcode === Opcodes.OpPop
  }

  removeLastPop = (): void => {
    this.instructions = this.instructions.slice(
      0,
      this.lastInstruction?.position
    )
  }

  replaceInstruction = (position: number, newInstructions: number[]): void => {
    this.instructions.splice(
      position,
      newInstructions.length,
      ...newInstructions
    )
  }

  changeOperand = (opPosition: number, operand: number) => {
    const newInstruction = make(this.instructions[opPosition], operand)

    this.replaceInstruction(opPosition, newInstruction)
  }

  get bytecode(): Bytecode {
    return new Bytecode(this.instructions, this.constants)
  }
}
