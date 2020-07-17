import { Identifier, BlockStatement } from './ast'
import { Environment } from './environment'

export interface BaseObject {
  toString: () => string
  value: number | boolean | null | BaseObject | string
  readonly primitive: string
  message?: string // errors only
}

export class IntegerObj implements BaseObject {
  readonly primitive = 'INTEGER'

  constructor(public readonly value: number) {}

  toString() {
    return String(this.value)
  }
}

export class BooleanObj implements BaseObject {
  readonly primitive = 'BOOLEAN'

  constructor(public readonly value: boolean) {}

  toString() {
    return String(this.value)
  }
}

export class NullObj implements BaseObject {
  readonly primitive = 'NULL'

  public readonly value: null

  constructor() {
    this.value = null
  }

  toString() {
    return 'null'
  }
}

export class ReturnObj implements BaseObject {
  readonly primitive = 'RETURN_VALUE'

  constructor(public readonly value: BaseObject) {}

  toString() {
    return this.value.toString()
  }
}

export class ErrorObj implements BaseObject {
  value = null
  primitive = 'ERROR'

  constructor(public readonly message: string) {}

  toString() {
    return `ERROR: ${this.message}`
  }
}

export class FunctionObj implements BaseObject {
  readonly primitive = 'FUNCTION'
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

export class StringObj implements BaseObject {
  readonly primitive = 'STRING'
  constructor(public readonly value: string) {}

  toString() {
    return this.value
  }
}

type BuiltinFunction = (...args: BaseObject[]) => BaseObject

export class BuiltinFuncObj implements BaseObject {
  readonly primitive = 'BUILTIN'
  value = null // might need to change this?

  constructor(public readonly func: BuiltinFunction) {}

  toString() {
    return 'builtin function'
  }
}

export class ArrayObj implements BaseObject {
  readonly primitive = 'ARRAY'

  constructor(public readonly elements: BaseObject[]) {}

  value = null

  toString() {
    return `[${this.elements.map((e) => e.toString()).join(', ')}]`
  }
}
