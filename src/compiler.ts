import { Node, Program } from './ast'
import { Instructions } from './code'

export class Bytecode {
  constructor(public instructions: Instructions, public constants: any[]) {}
}

export class Compiler {
  // not really readonly?
  private readonly instructions: Instructions = []
  private readonly constants: any[] = []

  compile = (node: Node) => {}

  bytecode = (): Bytecode => {
    return new Bytecode(this.instructions, this.constants)
  }
}
