const enum ObjectType {
  INTEGER_OBJ = 'INTEGER',
  BOOLEAN_OBJ = 'BOOLEAN',
  NULL_OBJ = 'NULL',
}

export interface BaseObject {
  type: () => ObjectType
  inspect: () => string
}

export interface BaseNonNullObject extends BaseObject {
  value: any
}

export type Obj = BaseObject | BaseNonNullObject

export class IntegerObj implements BaseNonNullObject {
  constructor(public value: number) {}
  type() {
    return ObjectType.INTEGER_OBJ
  }

  inspect() {
    return String(this.value)
  }
}

export class BooleanObj implements BaseNonNullObject {
  constructor(public value: boolean) {}

  type() {
    return ObjectType.BOOLEAN_OBJ
  }

  inspect() {
    return String(this.value)
  }
}

export class NullObj implements BaseObject {
  type() {
    return ObjectType.NULL_OBJ
  }

  inspect() {
    return 'null'
  }
}
