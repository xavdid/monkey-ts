import {
  BooleanLiteral,
  ExpressionStatement,
  InfixExpression,
  IntegerLiteral,
  Node,
  PrefixExpression,
  Program,
} from './ast'
import { Instructions, make, Opcodes, stringifyInstructions } from './code'
import { BaseObject, IntegerObj } from './object'

export class Bytecode {
  constructor(
    public instructions: Instructions,
    public constants: BaseObject[]
  ) {}

  toString() {
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
  // not really readonly?
  private readonly instructions: Instructions = []
  private readonly constants: any[] = []

  compile = (node: Node): void => {
    if (node instanceof Program) {
      node.statements.forEach((s) => {
        this.compile(s)
      })
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
    }
  }

  emit = (op: Opcodes, ...operands: number[]): number => {
    const instruction = make(op, ...operands)
    return this.addInstruction(instruction)
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

  get bytecode(): Bytecode {
    return new Bytecode(this.instructions, this.constants)
  }
}
