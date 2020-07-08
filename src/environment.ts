import { BaseObject } from './object'

export class Environment {
  private readonly store: { [x: string]: BaseObject | undefined } = {}

  constructor(private readonly outer?: Environment) {}

  get(name: string): BaseObject | undefined {
    let result = this.store[name]
    if (!result && this.outer) {
      result = this.outer.get(name)
    }
    return result
  }

  set(name: string, val: BaseObject): BaseObject {
    this.store[name] = val
    return val
  }
}
