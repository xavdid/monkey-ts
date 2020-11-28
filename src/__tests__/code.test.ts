import { make, Opcodes } from '../code'

describe('code', () => {
  describe('make', () => {
    it('should work', () => {
      const tests: Array<{
        op: Opcodes
        operands: number[]
        expected: Uint8Array
      }> = [
        {
          op: Opcodes.OpConstant,
          operands: [65534],
          expected: new Uint8Array([Opcodes.OpConstant, 255, 254]),
        },
      ]

      tests.forEach(({ op, operands, expected }) => {
        expect(make(op, ...operands)).toEqual(expected)
      })
    })
  })
})
