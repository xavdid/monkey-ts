import { Instructions } from './code'
import { CompiledFunctionObj } from './object'

export class Frame {
  public instructionPointer = -1

  constructor(public fn: CompiledFunctionObj, public basePointer: number) {}

  get instructions(): Instructions {
    return this.fn.instructions
  }
}
