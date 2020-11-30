import { Instructions, make, Opcodes } from '../code'
import { Compiler } from '../compiler'
import { BaseObject } from '../object'
import { parseProgram, testIntegerObj } from './helpers'

interface CompilerTestCase {
  input: string
  expectedConstants: any[]
  expectedInstructions: Instructions[]
}

const testInstructions = (expected: Instructions[], actual: Instructions) => {
  expect(actual).toEqual(expected.flat())
  // flatExpected.forEach((exp, index) => {
  //   expect(exp).toEqual(actual[index])
  // })
}

const testConstants = (expected: any[], actual: BaseObject[]) => {
  expect(expected).toHaveLength(actual.length)
  expected.forEach((constant, index) => {
    if (typeof constant === 'number') {
      testIntegerObj(actual[index], constant)
    }
  })
}

const runCompilerTest = (tests: CompilerTestCase[]) => {
  tests.forEach(({ input, expectedConstants, expectedInstructions }) => {
    const program = parseProgram(input)

    const compiler = new Compiler()
    compiler.compile(program)

    const bytecode = compiler.bytecode()

    testInstructions(expectedInstructions, bytecode.instructions)
    testConstants(expectedConstants, bytecode.constants)
  })
}

describe('compiler', () => {
  // eslint-disable-next-line jest/expect-expect
  it('should run arithmetic', () => {
    const tests: CompilerTestCase[] = [
      {
        input: '1 + 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
        ],
      },
    ]

    runCompilerTest(tests)
  })
})
