import { Instructions, make, Opcodes, stringifyInstructions } from '../code'
import { Compiler } from '../compiler'
import { BaseObject } from '../object'
import { parseProgram, testIntegerObj, testStringObj } from './helpers'

interface CompilerTestCase {
  input: string
  expectedConstants: Array<string | number>
  expectedInstructions: Instructions[]
}

const testInstructions = (expected: Instructions[], actual: Instructions) => {
  try {
    expect(actual).toEqual(expected.flat())
  } catch (e) {
    console.log(
      [
        'expected:',
        stringifyInstructions(expected.flat()),
        '',
        'actual:',
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
    } else if (typeof constant === 'string') {
      testStringObj(actual[index], constant)
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
  test('integer arithmetic', () => {
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
      // ? smartly re-use already-allocated constants?
      // {
      //   input: '1 + 1',
      //   expectedConstants: [1],
      //   expectedInstructions: [
      //     make(Opcodes.OpConstant, 0),
      //     make(Opcodes.OpConstant, 0),
      //     make(Opcodes.OpAdd),
      //     make(Opcodes.OpPop),
      //   ],
      // },
      {
        input: '1 - 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpSub),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: '1 * 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpMul),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: '2 / 1',
        expectedConstants: [2, 1],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpDiv),
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
      {
        input: '-1',
        expectedConstants: [1],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpMinus),
          make(Opcodes.OpPop),
        ],
      },
    ]

    runCompilerTest(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('boolean expressions', () => {
    const tests: CompilerTestCase[] = [
      {
        input: 'true',
        expectedConstants: [],
        expectedInstructions: [make(Opcodes.OpTrue), make(Opcodes.OpPop)],
      },
      {
        input: 'false',
        expectedConstants: [],
        expectedInstructions: [make(Opcodes.OpFalse), make(Opcodes.OpPop)],
      },
      {
        input: '1 > 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpGreaterThan),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: '1 < 2',
        expectedConstants: [2, 1],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpGreaterThan),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: '1 == 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpEqual),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: '1 != 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpNotEqual),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: 'true == false',
        expectedConstants: [],
        expectedInstructions: [
          make(Opcodes.OpTrue),
          make(Opcodes.OpFalse),
          make(Opcodes.OpEqual),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: 'true != false',
        expectedConstants: [],
        expectedInstructions: [
          make(Opcodes.OpTrue),
          make(Opcodes.OpFalse),
          make(Opcodes.OpNotEqual),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: '!true',
        expectedConstants: [],
        expectedInstructions: [
          make(Opcodes.OpTrue),
          make(Opcodes.OpBang),
          make(Opcodes.OpPop),
        ],
      },
    ]

    runCompilerTest(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('conditionals', () => {
    const tests: CompilerTestCase[] = [
      {
        input: 'if (true) { 10 }; 3333;',
        expectedConstants: [10, 3333],
        expectedInstructions: [
          // 0000
          make(Opcodes.OpTrue),
          // 0001
          make(Opcodes.OpJumpNotTruthy, 10),
          // 0004
          make(Opcodes.OpConstant, 0),
          // 0007
          make(Opcodes.OpJump, 11),
          // 0010
          make(Opcodes.OpNull),
          // 0011
          make(Opcodes.OpPop),
          // 0012
          make(Opcodes.OpConstant, 1),
          // 0015
          make(Opcodes.OpPop),
        ],
      },
      {
        input: 'if (true) { 10 } else { 20 }; 3333;',
        expectedConstants: [10, 20, 3333],
        expectedInstructions: [
          // 0000
          make(Opcodes.OpTrue),
          // 0001
          make(Opcodes.OpJumpNotTruthy, 10),
          // 0004
          make(Opcodes.OpConstant, 0),
          // 0007
          make(Opcodes.OpJump, 13),
          // 0010
          make(Opcodes.OpConstant, 1),
          // 0013
          make(Opcodes.OpPop),
          // 0014
          make(Opcodes.OpConstant, 2),
          // 0017
          make(Opcodes.OpPop),
        ],
      },
    ]
    runCompilerTest(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('global let statements', () => {
    const tests: CompilerTestCase[] = [
      {
        input: 'let one = 1; let two = 2;',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpSetGlobal, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpSetGlobal, 1),
        ],
      },
      {
        input: 'let one = 1; one;',
        expectedConstants: [1],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpSetGlobal, 0),
          make(Opcodes.OpGetGlobal, 0),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: 'let one = 1; let two = one; two;',
        expectedConstants: [1],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpSetGlobal, 0),
          make(Opcodes.OpGetGlobal, 0),
          make(Opcodes.OpSetGlobal, 1),
          make(Opcodes.OpGetGlobal, 1),
          make(Opcodes.OpPop),
        ],
      },
    ]
    runCompilerTest(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('string expressions', () => {
    const tests: CompilerTestCase[] = [
      {
        input: '"monkey"',
        expectedConstants: ['monkey'],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpPop),
        ],
      },
      {
        input: '"mon" + "key"',
        expectedConstants: ['mon', 'key'],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpAdd),
          make(Opcodes.OpPop),
        ],
      },
    ]
    runCompilerTest(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('array literals', () => {
    const tests: CompilerTestCase[] = [
      {
        input: '[]',
        expectedConstants: [],
        expectedInstructions: [make(Opcodes.OpArray, 0), make(Opcodes.OpPop)],
      },
      {
        input: '[1, 2, 3]',
        expectedConstants: [1, 2, 3],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpConstant, 2),
          make(Opcodes.OpArray, 3),
          make(Opcodes.OpPop),
        ],
      },

      {
        input: '[1 + 2, 3 - 4, 5 * 6]',
        expectedConstants: [1, 2, 3, 4, 5, 6],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpAdd),
          make(Opcodes.OpConstant, 2),
          make(Opcodes.OpConstant, 3),
          make(Opcodes.OpSub),
          make(Opcodes.OpConstant, 4),
          make(Opcodes.OpConstant, 5),
          make(Opcodes.OpMul),
          make(Opcodes.OpArray, 3),
          make(Opcodes.OpPop),
        ],
      },
    ]
    runCompilerTest(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('hash literals', () => {
    const tests: CompilerTestCase[] = [
      {
        input: '{}',
        expectedConstants: [],
        expectedInstructions: [make(Opcodes.OpHash, 0), make(Opcodes.OpPop)],
      },
      {
        input: '{1: 2, 3: 4, 5: 6}',
        expectedConstants: [1, 2, 3, 4, 5, 6],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpConstant, 2),
          make(Opcodes.OpConstant, 3),
          make(Opcodes.OpConstant, 4),
          make(Opcodes.OpConstant, 5),
          make(Opcodes.OpHash, 6),
          make(Opcodes.OpPop),
        ],
      },

      {
        input: '{1: 2 + 3, 4: 5 * 6}',
        expectedConstants: [1, 2, 3, 4, 5, 6],
        expectedInstructions: [
          make(Opcodes.OpConstant, 0),
          make(Opcodes.OpConstant, 1),
          make(Opcodes.OpConstant, 2),
          make(Opcodes.OpAdd),
          make(Opcodes.OpConstant, 3),
          make(Opcodes.OpConstant, 4),
          make(Opcodes.OpConstant, 5),
          make(Opcodes.OpMul),
          make(Opcodes.OpHash, 4),
          make(Opcodes.OpPop),
        ],
      },
    ]
    runCompilerTest(tests)
  })
})
