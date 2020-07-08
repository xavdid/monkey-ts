import { Identifier, BlockStatement } from './ast'
import { Environment } from './environment'

export interface BaseObject {
  toString: () => string
  value: number | boolean | null | BaseObject
  privitive: string
  message?: string // errors only
}

export class IntegerObj implements BaseObject {
  privitive = 'INTEGER'

  constructor(public readonly value: number) {}

  toString() {
    return String(this.value)
  }
}

export class BooleanObj implements BaseObject {
  privitive = 'BOOLEAN'

  constructor(public readonly value: boolean) {}

  toString() {
    return String(this.value)
  }
}

export class NullObj implements BaseObject {
  privitive = 'NULL'

  public readonly value: null

  constructor() {
    this.value = null
  }

  toString() {
    return 'null'
  }
}

export class ReturnObj implements BaseObject {
  privitive = 'RETURN_VALUE'

  constructor(public readonly value: BaseObject) {}

  toString() {
    return this.value.toString()
  }
}

export class ErrorObj implements BaseObject {
  value = null
  privitive = 'ERROR'

  constructor(public readonly message: string) {}

  toString() {
    return `ERROR: ${this.message}`
  }
}

export class FunctionObj implements BaseObject {
  privitive = 'FUNCTION'
  value = null // might need to change this

  constructor(
    public readonly parameters: Identifier[],
    public readonly body: BlockStatement,
    public env: Environment
  ) {}

  toString() {
    return `fn(${this.parameters.join(', ')}) {
      ${this.body}
    }`
  }
}
