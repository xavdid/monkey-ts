// export const enum ObjectType {
//   INTEGER_OBJ = 'INTEGER',
//   BOOLEAN_OBJ = 'BOOLEAN',
//   NULL_OBJ = 'NULL',
// }

export interface BaseObject {
  // type: ObjectType
  toString: () => string
  value: number | boolean | null | BaseObject
}

export class IntegerObj implements BaseObject {
  // type = ObjectType.INTEGER_OBJ
  constructor(public readonly value: number) {}

  toString() {
    return String(this.value)
  }
}

export class BooleanObj implements BaseObject {
  // type = ObjectType.BOOLEAN_OBJ
  constructor(public readonly value: boolean) {}

  toString() {
    return String(this.value)
  }
}

export class NullObj implements BaseObject {
  // type = ObjectType.NULL_OBJ
  public readonly value: null

  constructor() {
    this.value = null
  }

  toString() {
    return 'null'
  }
}

export class ReturnObj implements BaseObject {
  constructor(public readonly value: BaseObject) {}

  toString() {
    return this.value.toString()
  }
}
