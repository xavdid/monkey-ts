import { Instructions, make, Opcodes, stringifyInstructions } from '../code'
import { Compiler } from '../compiler'
import { BaseObject } from '../object'
import { parseProgram, testIntegerObj } from './helpers'

interface CompilerTestCase {
  input: string
  expectedConstants: any[]
  expectedInstructions: Instructions[]
}

const testInstructions = (expected: Instructions[], actual: Instructions) => {
  try {
    expect(actual).toEqual(expected.flat())
  } catch (e) {
    console.log(
      [
        'expected',
        stringifyInstructions(expected.flat()),
        '',
        'actual',
        stringifyInstructions(actual),
      ].join('\n')
    )
    throw e
  }
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

    const bytecode = compiler.bytecode

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
          make(Opcodes.OpAdd),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: '1; 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpPop),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpPop),
        ],
      },
    ]

    runCompilerTest(tests)
  })
})
