const enum ObjectType {
  INTEGER_OBJ = 'INTEGER',
  BOOLEAN_OBJ = 'BOOLEAN',
  NULL_OBJ = 'NULL',
}

interface BaseObject {
  type: () => ObjectType
  inspect: () => string
}

interface BaseNonNullObject extends BaseObject {
  value: any
}

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
