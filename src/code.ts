// const stringifyByte = (byte: number): string => {}

// byte[]?
export type Instructions = number[]

// type Opcode = number // can't make uint8? that's not a primitive

// const MAX_16_BIT_SIZE = 256

// need to make sure all these values fit in a single byte?
// that'll be fine as long as I don't have 256 opcodes
// make these Byte objects?
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

// his is `ReadUint16`
export const hexBytesToNum = (nums: number[]): number => {
  return parseInt(Buffer.from(nums).toString('hex'), 16)
}

// this is probably a big performance hit
export const numToHexBytes = (num: number, width: number): number[] => {
  const paddedHex = num.toString(16).padStart(2 * width, '0')

  // this looks odd, but it's faster than `[...buffer]` and I'll bet speed matters here
  // https://stackoverflow.com/a/55127012/1825390
  return Buffer.from(paddedHex, 'hex').toJSON().data
}

export const make = (op: Opcodes, ...operands: number[]): number[] => {
  const def = definitions.get(op)
  if (!def) {
    return []
  }

  let instructionLen = 1
  // just need to sum all the widths + 1
  def.operandWidths.forEach((w) => (instructionLen += w))

  // let offset = 1
  let res: number[] = []
  operands.forEach((operand, index) => {
    const width = def.operandWidths[index]
    switch (width) {
      case 2:
        res = numToHexBytes(operand, width)
        break
      default:
        throw new Error('not yet implemented')
    }
    // offset += width
  })

  return [op, ...res]
}

export const readOperands = (
  def: Definition,
  instructions: Instructions
): [number[], number] => {
  const operands: number[] = Array(def.operandWidths.length)
  let offset = 0
  def.operandWidths.forEach((width, index) => {
    switch (width) {
      case 2:
        operands[index] = hexBytesToNum(instructions.slice(offset))
        break
      default:
        throw new Error('unimplemented readOperands')
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
      `${i.toString().padStart(4, '0')} ${strintifyOperand(def, operands)}`
    )

    i += 1 + read
  }
  return res.join('\n')
}

const strintifyOperand = (def: Definition, operands: number[]): string => {
  const operandCount = def.operandWidths.length
  if (operands.length !== operandCount) {
    throw new Error(
      `mismatched operand lengths: ${operands.length} !== ${operandCount}`
    )
  }

  switch (operandCount) {
    case 1:
      return `${def.name} ${operands[0]}`
    default:
      throw new Error(`Stringify not ipmlemented: ${def.name}`)
  }
}
