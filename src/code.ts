// const stringifyByte = (byte: number): string => {}

// byte[]?
export type Instructions = number[]

// type Opcode = number // can't make uint8? that's not a primitive

// const MAX_16_BIT_SIZE = 256

// need to make sure all these values fit in a single byte?
// that'll be fine as long as I don't have 256 opcodes
// make these Byte objects?
export enum Opcodes {
  // numbers
  OpConstant,
  // arithmetic
  OpAdd,
  OpPop,
  OpSub,
  OpMul,
  OpDiv,
  // booleans
  OpTrue,
  OpFalse,
  OpNull,
  // comparisons
  OpEqual,
  OpNotEqual,
  // don't need a lessThan because we can just reorder the operands
  OpGreaterThan,
  // prefix expressions
  OpMinus,
  OpBang,
  // control flow
  OpJumpNotTruthy,
  OpJump,
  OpReturnValue, // return w/ value
  OpReturn, // return w/o value
  // variables
  OpGetGlobal,
  OpSetGlobal,
  OpGetLocal,
  OpSetLocal,
  OpGetBuiltin,
  OpGetFree,
  // data structures
  OpArray,
  OpHash,
  OpIndex,
  OpCall,
  OpClosure,
}

class Definition {
  /**
   * operandWidths is how many 8-bit numbers each operand is
   * `[2]` is a single 16-bit operand
   * `[1, 2]` would be an 8-bit followed by a 16-bit
   */
  constructor(public name: string, public operandWidths: number[]) {}
}

const _definitions: Array<[Opcodes, number[]]> = [
  [Opcodes.OpConstant, [2]],
  [Opcodes.OpAdd, []],
  [Opcodes.OpPop, []],
  [Opcodes.OpSub, []],
  [Opcodes.OpMul, []],
  [Opcodes.OpDiv, []],
  [Opcodes.OpTrue, []],
  [Opcodes.OpFalse, []],
  [Opcodes.OpEqual, []],
  [Opcodes.OpNotEqual, []],
  [Opcodes.OpGreaterThan, []],
  [Opcodes.OpMinus, []],
  [Opcodes.OpBang, []],
  [Opcodes.OpJumpNotTruthy, [2]],
  [Opcodes.OpJump, [2]],
  [Opcodes.OpNull, []],
  [Opcodes.OpGetGlobal, [2]],
  [Opcodes.OpSetGlobal, [2]],
  [Opcodes.OpGetLocal, [1]],
  [Opcodes.OpSetLocal, [1]],
  [Opcodes.OpGetBuiltin, [1]],
  [Opcodes.OpGetBuiltin, [1]],
  [Opcodes.OpArray, [2]],
  [Opcodes.OpHash, [2]],
  [Opcodes.OpIndex, []],
  [Opcodes.OpCall, [1]],
  [Opcodes.OpReturnValue, []],
  [Opcodes.OpReturn, []],
  [Opcodes.OpClosure, [2, 1]],
]

export const definitions = new Map<Opcodes, Definition>(
  _definitions.map(([opcode, paramWidths]) => [
    opcode,
    new Definition(Opcodes[opcode], paramWidths),
  ])
)

export const lookup = (op: number): Definition => {
  const def = definitions.get(op)
  if (!def) {
    throw new Error(`opcode ${op} undefined`)
  }
  return def
}

export const readUint16 = (nums: number[]): number => {
  // takes only the first two items from an index, ignores the rest
  if (nums.length < 2) {
    throw new Error('unable to read Uint16 from array smaller than 2')
  }

  return parseInt(Buffer.from(nums.slice(0, 2)).toString('hex'), 16)
}

export const readUint8 = (nums: number[]): number => {
  // takes only the first two items from an index, ignores the rest
  if (nums.length < 1) {
    throw new Error('unable to read Uint8 from array smaller than 1')
  }

  return parseInt(Buffer.from([nums[0]]).toString('hex'), 16)
}

// this is called a lot, make it fast
export const numToHexBytes = (num: number, width: number): number[] => {
  const paddedHex = num.toString(16).padStart(2 * width, '0')

  // `toJSON` looks odd, but it's faster than `[...buffer]` and I'll bet speed matters here
  // https://stackoverflow.com/a/55127012/1825390
  return Buffer.from(paddedHex, 'hex').toJSON().data
}

/**
 * responsible for building properly-spaced bytecode from an opcode an its (optional) operands
 */
export const make = (op: Opcodes, ...operands: number[]): number[] => {
  const def = definitions.get(op)
  if (!def) {
    return []
  }

  let res: number[] = []
  operands.forEach((operand, index) => {
    const width = def.operandWidths[index]
    // only currently tested with widths 0, 1, and 2. Likely works with wider op groups though
    if (width > 2) {
      throw new Error(`width ${width} not yet implemented in "make"`)
    }
    res = res.concat(...numToHexBytes(operand, width))
  })

  return [op, ...res]
}

export const readOperands = (
  def: Definition,
  instructions: Instructions
): [number[], number] => {
  const operands: number[] = []
  let offset = 0
  def.operandWidths.forEach((width, index) => {
    // TODO: simplify this
    switch (width) {
      case 2:
        operands[index] = readUint16(instructions.slice(offset))
        break
      case 1:
        operands[index] = readUint8(instructions.slice(offset))
        break
      default:
        throw new Error(`width ${width} not unimplemented in readOperands`)
    }
    offset += width
  })
  return [operands, offset]
}

export const stringifyInstructions = (ins: Instructions): string => {
  const res = []
  let i = 0
  while (i < ins.length) {
    const def = lookup(ins[i])
    const [operands, read] = readOperands(def, ins.slice(i + 1))
    res.push(
      `${i.toString().padStart(4, '0')} ${stringifyOperand(def, operands)}`
    )

    i += 1 + read
  }
  return res.join('\n')
}

const stringifyOperand = (def: Definition, operands: number[]): string => {
  const operandCount = def.operandWidths.length
  if (operands.length !== operandCount) {
    throw new Error(
      `mismatched operand lengths: ${operands.length} !== ${operandCount}`
    )
  }

  return `${def.name}${operands.length > 0 ? ` ${operands.join(' ')}` : ''}`
}
