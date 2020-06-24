const enum ObjectType {
  INTEGER_OBJ = 'INTEGER',
  BOOLEAN_OBJ = 'BOOLEAN',
  NULL_OBJ = 'NULL',
}

export interface BaseObject {
  type: () => ObjectType
  inspect: () => string
  value: number | boolean | null
}

export class IntegerObj implements BaseObject {
  constructor(public readonly value: number) {}
  type() {
    return ObjectType.INTEGER_OBJ
  }

  inspect() {
    return String(this.value)
  }
}

export class BooleanObj implements BaseObject {
  constructor(public readonly value: boolean) {}

  type() {
    return ObjectType.BOOLEAN_OBJ
  }

  inspect() {
    return String(this.value)
  }
}

export class NullObj implements BaseObject {
  public readonly value: null
  constructor() {
    this.value = null
  }

  type() {
    return ObjectType.NULL_OBJ
  }

  inspect() {
    return 'null'
  }
}
