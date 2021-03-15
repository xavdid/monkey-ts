import { Instructions } from './code'
import { CompiledFunction } from './object'

export class Frame {
  public instructionPointer = -1

  constructor(public fn: CompiledFunction) {}

  get instructions(): Instructions {
    return this.fn.instructions
  }
}
