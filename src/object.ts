import { Identifier, BlockStatement } from './ast'
import { Instructions } from './code'
import { Environment } from './environment'

// tihs could use some cleanup
export abstract class BaseObject {
  abstract toString(): string
  abstract value: number | boolean | null | BaseObject | string
  abstract clone(): BaseObject
  abstract readonly primitive: string
  message?: string // errors only
  isHashable = false
}

abstract class HashableObject extends BaseObject {
  hashKey() {
    // variation: this'll use more memory because we store the whole string
    // but, there's no chance of hash collisions and it's more easily debugged
    return `${this.primitive}|${this.value}`
  }

  isHashable = true
}

export const objIsHashable = (obj: BaseObject): obj is HashableObject => {
  return obj.isHashable
}

export class IntegerObj extends HashableObject {
  readonly primitive = 'INTEGER'

  constructor(public readonly value: number) {
    super()
  }

  toString() {
    return String(this.value)
  }

  clone() {
    return new IntegerObj(this.value)
  }
}

export class BooleanObj extends HashableObject {
  readonly primitive = 'BOOLEAN'

  constructor(public readonly value: boolean) {
    super()
  }

  toString() {
    return String(this.value)
  }

  clone() {
    return new BooleanObj(this.value)
  }
}

export class NullObj extends BaseObject {
  readonly primitive = 'NULL'

  public readonly value: null

  constructor() {
    super()
    // set here so that this constructor takes no args
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

export class ReturnObj extends BaseObject {
  readonly primitive = 'RETURN_VALUE'

  constructor(public readonly value: BaseObject) {
    super()
  }

  toString() {
    return this.value.toString()
  }

  clone() {
    console.log('cloning return??')
    return new ReturnObj(this.value.clone())
  }
}

export class ErrorObj extends BaseObject {
  value = null
  primitive = 'ERROR'

  constructor(public readonly message: string) {
    super()
  }

  toString() {
    return `ERROR: ${this.message}`
  }

  clone() {
    console.log('cloning error??')
    return this
  }
}

export class FunctionObj extends BaseObject {
  readonly primitive = 'FUNCTION'
  value = null // might need to change this

  constructor(
    public readonly parameters: Identifier[],
    public readonly body: BlockStatement,
    public env: Environment
  ) {
    super()
  }

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

export class StringObj extends HashableObject {
  readonly primitive = 'STRING'
  constructor(public readonly value: string) {
    super()
  }

  toString() {
    return this.value
  }

  clone() {
    return new StringObj(this.value)
  }
}

type BuiltinFunction = (...args: BaseObject[]) => BaseObject

export class BuiltinFuncObj extends BaseObject {
  readonly primitive = 'BUILTIN'
  value = null // might need to change this?

  constructor(public readonly func: BuiltinFunction) {
    super()
  }

  toString() {
    return 'builtin function'
  }

  clone() {
    // I think this works?
    return new BuiltinFuncObj(this.func)
  }
}

export class ArrayObj extends BaseObject {
  readonly primitive = 'ARRAY'
  value = null

  constructor(public readonly elements: BaseObject[]) {
    super()
  }

  toString() {
    return `[${this.elements.map((e) => e.toString()).join(', ')}]`
  }

  clone() {
    return new ArrayObj(this.elements.map((x) => x.clone()))
  }
}

export interface HashPair {
  key: BaseObject
  value: BaseObject
}
export class HashObj extends BaseObject {
  readonly primitive = 'HASH_OBJ'
  value = null

  constructor(public readonly pairs: Map<string, HashPair>) {
    super()
  }

  clone() {
    const clonedMap = new Map<string, HashPair>()
    for (const [key, value] of this.pairs) {
      // the key doesn't need cloning, since the hashkey will be the same
      clonedMap.set(key, { key: value.key.clone(), value: value.value.clone() })
    }
    return new HashObj(clonedMap)
  }

  toString() {
    return `
{
  ${Array.from(this.pairs)
    .map(([, { key, value }]) => `${key.toString()}: ${value.toString()}`)
    .join(',\n')}
}`.trim()
  }
}

export class CompiledFunction extends BaseObject {
  readonly primitive = 'COMPILED_FUNCTION_OBJ'
  value = null

  constructor(
    public readonly instructions: Instructions,
    public numLocals: number = 0
  ) {
    super()
  }

  toString() {
    return '<Compiled Function>'
  }

  clone() {
    return new CompiledFunction([...this.instructions], this.numLocals)
  }
}

// CONSTANTS
// there's only ever 1 true/false, so we can reuse those objects

export const TRUE = new BooleanObj(true)
export const FALSE = new BooleanObj(false)
export const NULL = new NullObj()
