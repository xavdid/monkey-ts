import { Identifier, BlockStatement } from './ast'
import { Environment } from './environment'

export interface BaseObject {
  toString: () => string
  value: number | boolean | null | BaseObject | string
  clone: () => BaseObject
  readonly primitive: string
  message?: string // errors only
}

export class IntegerObj implements BaseObject {
  readonly primitive = 'INTEGER'

  constructor(public readonly value: number) {}

  toString() {
    return String(this.value)
  }

  clone() {
    return new IntegerObj(this.value)
  }
}

export class BooleanObj implements BaseObject {
  readonly primitive = 'BOOLEAN'

  constructor(public readonly value: boolean) {}

  toString() {
    return String(this.value)
  }

  clone() {
    return new BooleanObj(this.value)
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

  clone() {
    console.log('cloning null??')
    return new NullObj()
  }
}

export class ReturnObj implements BaseObject {
  readonly primitive = 'RETURN_VALUE'

  constructor(public readonly value: BaseObject) {}

  toString() {
    return this.value.toString()
  }

  clone() {
    console.log('cloning return??')
    return new ReturnObj(this.value.clone())
  }
}

export class ErrorObj implements BaseObject {
  value = null
  primitive = 'ERROR'

  constructor(public readonly message: string) {}

  toString() {
    return `ERROR: ${this.message}`
  }

  clone() {
    console.log('cloning error??')
    return this
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

  clone() {
    return new FunctionObj(
      this.parameters.map((x) => x.clone()),
      this.body.clone(),
      this.env
    )
  }
}

export class StringObj implements BaseObject {
  readonly primitive = 'STRING'
  constructor(public readonly value: string) {}

  toString() {
    return this.value
  }

  clone() {
    return new StringObj(this.value)
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

  clone() {
    // I think this works?
    return new BuiltinFuncObj(this.func)
  }
}

export class ArrayObj implements BaseObject {
  readonly primitive = 'ARRAY'

  constructor(public readonly elements: BaseObject[]) {}

  value = null

  toString() {
    return `[${this.elements.map((e) => e.toString()).join(', ')}]`
  }

  clone() {
    return new ArrayObj(this.elements.map((x) => x.clone()))
  }
}

// CONSTANTS
// there's only ever 1 true/false, so we can reuse those objects

export const TRUE = new BooleanObj(true)
export const FALSE = new BooleanObj(false)
export const NULL = new NullObj()
