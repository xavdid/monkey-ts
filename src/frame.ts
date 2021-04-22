import { Instructions } from './code'
import { CompiledFunction } from './object'

export class Frame {
  public instructionPointer = -1

  constructor(public fn: CompiledFunction, public basePointer: number) {}

  get instructions(): Instructions {
    return this.fn.instructions
  }
}
