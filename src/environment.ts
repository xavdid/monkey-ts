import { BaseObject } from './object'

export class Environment {
  private store: { [x: string]: BaseObject } = {}

  get(name: string): BaseObject | undefined {
    return this.store[name]
  }

  set(name: string, val: BaseObject): BaseObject {
    this.store[name] = val
    return val
  }
}
