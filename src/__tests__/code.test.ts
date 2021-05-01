import {
  make,
  Opcodes,
  readUint16,
  numToHexBytes,
  lookup,
  readOperands,
  stringifyInstructions,
  Instructions,
} from '../code'

describe('code', () => {
  describe('bytes conversion', () => {
    test('number to bytes', () => {
      expect(readUint16([255, 254])).toEqual(65534)
      expect(readUint16([255, 17])).toEqual(65297)
      expect(readUint16([0, 1])).toEqual(1)
      // the rest of an array is ignored
      expect(readUint16([0, 1, 123, 123, 123, 123])).toEqual(1)
      expect(() => readUint16([1])).toThrow()
    })
    test('bytes to number', () => {
      expect(numToHexBytes(65534, 2)).toEqual([255, 254])
      expect(numToHexBytes(1, 2)).toEqual([0, 1])
      expect(numToHexBytes(1, 1)).toEqual([1])
    })
  })

  test('make', () => {
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
      {
        op: Opcodes.OpAdd,
        operands: [],
        expected: [Opcodes.OpAdd],
      },
      {
        op: Opcodes.OpGetLocal,
        operands: [255],
        expected: [Opcodes.OpGetLocal, 255],
      },
      {
        op: Opcodes.OpClosure,
        operands: [65534, 255],
        expected: [Opcodes.OpClosure, 255, 254, 255],
      },
    ]

    tests.forEach(({ op, operands, expected }) => {
      expect(make(op, ...operands)).toEqual(expected)
    })
  })

  describe('readOperands', () => {
    test('basic functionality', () => {
      const tests = [
        { op: Opcodes.OpConstant, operands: [65535], bytesRead: 2 },
        { op: Opcodes.OpGetLocal, operands: [255], bytesRead: 1 },
        { op: Opcodes.OpClosure, operands: [65535, 255], bytesRead: 3 },
      ]

      tests.forEach(({ op, operands, bytesRead }) => {
        const instruction = make(op, ...operands)
        const def = lookup(op)

        const [operandsRead, numRead] = readOperands(def, instruction.slice(1))

        expect(numRead).toEqual(bytesRead)
        expect(operandsRead).toEqual(operands)
      })
    })
  })

  describe('instructions', () => {
    it('should stringify correctly', () => {
      const tests: Array<{ input: Instructions; expected: string }> = [
        { input: make(Opcodes.OpAdd), expected: '0000 OpAdd' },
        { input: make(Opcodes.OpConstant, 2), expected: '0000 OpConstant 2' },
        {
          input: make(Opcodes.OpConstant, 65535),
          expected: '0000 OpConstant 65535',
        },
        {
          input: [
            make(Opcodes.OpConstant, 1),
            make(Opcodes.OpConstant, 2),
            make(Opcodes.OpConstant, 65535),
          ].flat(),
          expected:
            '0000 OpConstant 1\n0003 OpConstant 2\n0006 OpConstant 65535',
        },
        {
          input: [
            make(Opcodes.OpAdd),
            make(Opcodes.OpGetLocal, 1),
            make(Opcodes.OpConstant, 2),
            make(Opcodes.OpConstant, 65535),
          ].flat(),
          expected:
            '0000 OpAdd\n0001 OpGetLocal 1\n0003 OpConstant 2\n0006 OpConstant 65535',
        },
        {
          input: [
            make(Opcodes.OpAdd),
            make(Opcodes.OpGetLocal, 1),
            make(Opcodes.OpConstant, 2),
            make(Opcodes.OpConstant, 65535),
            make(Opcodes.OpClosure, 65535, 255),
          ].flat(),
          expected:
            '0000 OpAdd\n0001 OpGetLocal 1\n0003 OpConstant 2\n0006 OpConstant 65535\n0009 OpClosure 65535 255',
        },
      ]

      tests.forEach(({ input, expected }) => {
        expect(stringifyInstructions(input)).toEqual(expected)
      })
    })
  })
})
