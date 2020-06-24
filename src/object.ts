export const enum ObjectType {
  INTEGER_OBJ = 'INTEGER',
  BOOLEAN_OBJ = 'BOOLEAN',
  NULL_OBJ = 'NULL',
}

export interface BaseObject {
  type: ObjectType
  inspect: () => string
  value: number | boolean | null
}

export class IntegerObj implements BaseObject {
  type = ObjectType.INTEGER_OBJ
  constructor(public readonly value: number) {}

  inspect() {
    return String(this.value)
  }
}

export class BooleanObj implements BaseObject {
  type = ObjectType.BOOLEAN_OBJ
  constructor(public readonly value: boolean) {}

  inspect() {
    return String(this.value)
  }
}

export class NullObj implements BaseObject {
  type = ObjectType.NULL_OBJ
  public readonly value: null

  constructor() {
    this.value = null
  }

  inspect() {
    return 'null'
  }
}
