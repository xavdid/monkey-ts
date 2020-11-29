import {
  make,
  Opcodes,
  hexBytesToNum,
  numToHexBytes,
  lookup,
  readOperands,
  stringifyInstruction,
} from '../code'

describe('code', () => {
  describe('bytes conversion', () => {
    test('number to bytes', () => {
      expect(hexBytesToNum([255, 254])).toEqual(65534)
      expect(hexBytesToNum([255, 17])).toEqual(65297)
      expect(hexBytesToNum([1])).toEqual(1)
    })
    test('bytes to number', () => {
      expect(numToHexBytes(65534, 2)).toEqual([255, 254])
      expect(numToHexBytes(1, 2)).toEqual([0, 1])
      expect(numToHexBytes(1, 1)).toEqual([1])
    })
  })

  describe('make', () => {
    test('basic functionality', () => {
      const tests: Array<{
        op: Opcodes
        operands: number[]
        expected: number[]
      }> = [
        {
          op: Opcodes.OpConstant,
          operands: [65534],
          expected: [Opcodes.OpConstant, 255, 254],
        },
      ]

      tests.forEach(({ op, operands, expected }) => {
        expect(make(op, ...operands)).toEqual(expected)
      })
    })
  })

  describe('readOperands', () => {
    test('basic functionality', () => {
      const tests = [
        { op: Opcodes.OpConstant, operands: [65535], bytesRead: 2 },
      ]

      tests.forEach(({ op, operands, bytesRead }) => {
        const instruction = make(op, ...operands)
        const def = lookup(op)
        expect(def).toBeDefined()

        const [operandsRead, numRead] = readOperands(def, instruction.slice(1))

        expect(numRead).toEqual(bytesRead)
        expect(operandsRead).toEqual(operands)
      })
    })
  })

  describe('instructions', () => {
    it('should stringify correctly', () => {
      const tests = [
        { input: make(Opcodes.OpConstant, 1), expected: '0000 OpConstant 1' },
        { input: make(Opcodes.OpConstant, 2), expected: '0000 OpConstant 2' },
        {
          input: make(Opcodes.OpConstant, 65535),
          expected: '0000 OpConstant 65535',
        },
      ]

      tests.forEach(({ input, expected }) => {
        expect(stringifyInstruction(input)).toEqual(expected)
      })
    })
  })
})
