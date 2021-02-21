import {
  ArrayLiteral,
  BlockStatement,
  BooleanLiteral,
  ExpressionStatement,
  FunctionLiteral,
  HashLiteral,
  Identifier,
  IfExpression,
  IndexExpression,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  Node,
  PrefixExpression,
  Program,
  ReturnStatement,
  StringLiteral,
} from './ast'
import { Instructions, make, Opcodes, stringifyInstructions } from './code'
import { BaseObject, CompiledFunction, IntegerObj, StringObj } from './object'
import { SymbolTable } from './symbolTable'

class EmittedInstruction {
  constructor(
    // only optional so I can create bunk ones
    public readonly opcode?: Opcodes,
    public readonly position?: number
  ) {}
}

const blankCompilationScope = () =>
  new CompilationScope(
    [],
    // ? add started values to these so they don't need to be optionals?
    new EmittedInstruction(),
    new EmittedInstruction()
  )

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

export class CompilationScope {
  constructor(
    public instructions: Instructions,
    public lastInstruction: EmittedInstruction,
    public previousInstruction: EmittedInstruction
  ) {}
}

export class Compiler {
  // private readonly instructions: Instructions = []
  // these should be private, but we read them in tests
  scopeIndex = 0
  mainScope = blankCompilationScope()

  scopes: CompilationScope[] = [this.mainScope]

  constructor(
    private readonly symbolTable: SymbolTable = new SymbolTable(),
    private readonly constants: BaseObject[] = []
  ) {}

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

      const afterConsequencePos = this.currentInstructions.length
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
      const afterAlternativePos = this.currentInstructions.length
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
    } else if (node instanceof IndexExpression) {
      this.compile(node.left)
      this.compile(node.index)
      this.emit(Opcodes.OpIndex)
    } else if (node instanceof FunctionLiteral) {
      this.enterScope()
      this.compile(node.body)

      const instructions = this.leaveScope()
      this.emit(
        Opcodes.OpConstant,
        this.addConstant(new CompiledFunction(instructions))
      )
    } else if (node instanceof ReturnStatement) {
      // if (node.returnValue) {
      // TODO: maybe remove this `!`
      this.compile(node.returnValue!)
      this.emit(Opcodes.OpReturnValue)
      // }
    }
  }

  emit = (op: Opcodes, ...operands: number[]): number => {
    const instruction = make(op, ...operands)
    const position = this.addInstruction(instruction)

    this.setLastInstruction(op, position)

    return position
  }

  setLastInstruction = (op: Opcodes, pos: number): void => {
    this.scopes[this.scopeIndex].previousInstruction = this.scopes[
      this.scopeIndex
    ].lastInstruction
    this.scopes[this.scopeIndex].lastInstruction = new EmittedInstruction(
      op,
      pos
    )
  }

  addInstruction = (instruction: number[]): number => {
    const newInstructionPosition = this.currentInstructions.length
    const updatedInstructions = [...this.currentInstructions, ...instruction]

    this.scopes[this.scopeIndex].instructions = updatedInstructions

    return newInstructionPosition
  }

  addConstant = (obj: BaseObject): number => {
    this.constants.push(obj)
    return this.constants.length - 1
  }

  get currentInstructions(): Instructions {
    return this.scopes[this.scopeIndex].instructions
  }

  get isLastInstructionPop(): boolean {
    return this.scopes[this.scopeIndex].lastInstruction.opcode === Opcodes.OpPop
  }

  removeLastPop = (): void => {
    const last = this.scopes[this.scopeIndex].lastInstruction
    const previous = this.scopes[this.scopeIndex].previousInstruction

    const old = this.currentInstructions
    const newInstructions = old.slice(0, last.position)
    this.scopes[this.scopeIndex].instructions = newInstructions
    this.scopes[this.scopeIndex].lastInstruction = previous
  }

  replaceInstruction = (position: number, newInstructions: number[]): void => {
    this.currentInstructions.splice(
      position,
      newInstructions.length,
      ...newInstructions
    )
  }

  changeOperand = (opPosition: number, operand: number) => {
    const newInstruction = make(this.currentInstructions[opPosition], operand)

    this.replaceInstruction(opPosition, newInstruction)
  }

  enterScope = (): void => {
    this.scopes.push(blankCompilationScope())
    this.scopeIndex += 1
  }

  leaveScope = (): Instructions => {
    const instructions = this.currentInstructions

    this.scopes.pop()
    // TODO: don't need to store scope index
    this.scopeIndex -= 1
    return instructions
  }

  get bytecode(): Bytecode {
    return new Bytecode(this.currentInstructions, this.constants)
  }
}
