import { Instructions } from './code'
import { ClosureObj } from './object'

export class Frame {
  public instructionPointer = -1

  constructor(public closure: ClosureObj, public basePointer: number) {}

  get instructions(): Instructions {
    return this.closure.func.instructions
  }
}
