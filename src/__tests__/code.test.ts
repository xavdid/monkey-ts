import { make, Opcodes } from '../code'

describe('code', () => {
  describe('make', () => {
    it('should work', () => {
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
        expect(make(op, ...operands)).toEqual(new Uint8Array(expected))
      })
    })
  })
})
