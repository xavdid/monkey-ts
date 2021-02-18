import {
  ArrayLiteral,
  BlockStatement,
  BooleanLiteral,
  ExpressionStatement,
  HashLiteral,
  Identifier,
  IfExpression,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  Node,
  PrefixExpression,
  Program,
  StringLiteral,
} from './ast'
import { Instructions, make, Opcodes, stringifyInstructions } from './code'
import { BaseObject, IntegerObj, StringObj } from './object'
import { SymbolTable } from './symbolTable'

class EmittedInstruction {
  constructor(
    public readonly opcode: Opcodes,
    public readonly position: number
  ) {}
}

export class Bytecode {
  constructor(
    public instructions: Instructions,
    // values that are constant at compile time (such as booleans an integers) can be declared and referenced
    // bytecode will point to the index of a constant
    // TODO: allow this to re-use already delcared nubmers?
    public readonly constants: BaseObject[]
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

  constructor(
    private readonly symbolTable: SymbolTable = new SymbolTable(),
    private readonly constants: BaseObject[] = []
  ) {}

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
    } else if (node instanceof StringLiteral) {
      const str = new StringObj(node.value)
      this.emit(Opcodes.OpConstant, this.addConstant(str))
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

      // Emit JMP with a bogus value, save the pointer
      const jumpPos = this.emit(Opcodes.OpJump, 9999)

      const afterConsequencePos = this.instructions.length
      this.changeOperand(jumpNotTruthyPos, afterConsequencePos)

      if (node.alternative) {
        // if there's an else, we have to jump farther
        this.compile(node.alternative)

        if (this.isLastInstructionPop) {
          this.removeLastPop()
        }
      } else {
        this.emit(Opcodes.OpNull)
      }
      const afterAlternativePos = this.instructions.length
      this.changeOperand(jumpPos, afterAlternativePos)
    } else if (node instanceof BlockStatement) {
      node.statements.forEach(this.compile)
    } else if (node instanceof LetStatement) {
      this.compile(node.value)
      const sym = this.symbolTable.define(node.name.value)
      this.emit(Opcodes.OpSetGlobal, sym.index)
    } else if (node instanceof Identifier) {
      const sym = this.symbolTable.resolve(node.value)
      if (sym === undefined) {
        throw new Error(`undefined variable: "${node.value}"`)
      }
      this.emit(Opcodes.OpGetGlobal, sym.index)
    } else if (node instanceof ArrayLiteral) {
      node.elements.forEach((element) => {
        this.compile(element)
      })
      this.emit(Opcodes.OpArray, node.elements.length)
    } else if (node instanceof HashLiteral) {
      // if there are int keys, JS will sort them weirdly but at least it'll be consistent
      const sortedKeys = Array.from(node.pairs.keys()).sort((a, b) =>
        a.toString() > b.toString() ? 1 : -1
      )
      sortedKeys.forEach((key) => {
        this.compile(key)
        this.compile(node.pairs.get(key)!)
      })
      this.emit(Opcodes.OpHash, node.pairs.size * 2)
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
