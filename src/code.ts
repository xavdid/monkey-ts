type Instructions = Uint8Array
type Opcode = number // can't make uint8? that's not a primitive

const MAX_16_BIT_SIZE = 256

// need to make sure all these values fit in a single byte?
// that'll be fine as long as I don't have 256 opcodes
export enum Opcodes {
  OpConstant,
}

// not positive width is actually an array? go is weird
class Definition {
  constructor(public name: string, public operandWidths: number[]) {}
}

export const definitions = new Map<Opcodes, Definition>([
  [Opcodes.OpConstant, new Definition(Opcodes[Opcodes.OpConstant], [2])],
])

export const lookup = (op: number): Definition => {
  const def = definitions.get(op)
  if (!def) {
    throw new Error(`opcode ${op} undefined`)
  }
  return def
}

// binary math

/**
 * function should split `n` into `size` uint8s
 */
const bigEndianArr = (n: number, size: number): Uint8Array => {
  // TODO: clamp to 16 bit max? (~65k)
  const res = new Uint8Array(size)

  let index = 0

  while (index < size) {
    if (n > MAX_16_BIT_SIZE) {
      res[index] = Math.floor(n / MAX_16_BIT_SIZE)
      n -= res[index] * MAX_16_BIT_SIZE
      index++
    } else {
      res[index] = n
      return res
    }
  }

  return res
}

export const make = (op: Opcodes, ...operands: number[]): Uint8Array => {
  const def = definitions.get(op)
  if (!def) {
    return new Uint8Array()
  }

  let instructionLen = 1
  // just need to sum all the widths + 1
  def.operandWidths.forEach((w) => (instructionLen += w))

  // let offset = 1
  let res = new Uint8Array()
  operands.forEach((operand, index) => {
    const width = def.operandWidths[index]
    switch (width) {
      case 2:
        res = bigEndianArr(operand, width)
        break
      default:
        throw new Error('not yet implemented')
    }
    // offset += width
  })

  return Uint8Array.from([op, ...res])
}
