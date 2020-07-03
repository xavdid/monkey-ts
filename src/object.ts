export interface BaseObject {
  toString: () => string
  value: number | boolean | null | BaseObject
  message?: string // errors only
  privitive: string
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
