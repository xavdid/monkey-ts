import { Instructions, make, Opcodes, stringifyInstructions } from '../code'
import { Compiler } from '../compiler'
import { BaseObject, CompiledFunctionObj } from '../object'
import { parseProgram, testIntegerObj, testStringObj } from './helpers'

interface CompilerTestCase {
  input: string
  expectedConstants: Array<string | number | Instructions[]>
  expectedInstructions: Instructions[]
}

const testInstructions = (
  expected: Instructions[],
  actual: Instructions,
  index: number,
  subfunction = false
) => {
  try {
    expect(actual).toEqual(expected.flat())
  } catch (e) {
    console.log(
      [
        `failed on test @ index ${index}`,
        subfunction ? '(sub-function)\n' : '',
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

const testConstants = (
  expected: any[],
  actual: BaseObject[],
  testIndex: number
) => {
  expect(expected).toHaveLength(actual.length)
  expected.forEach((constant, index) => {
    if (typeof constant === 'number') {
      testIntegerObj(actual[index], constant)
    } else if (typeof constant === 'string') {
      testStringObj(actual[index], constant)
    } else if (Array.isArray(constant)) {
      expect(actual[index]).toBeInstanceOf(CompiledFunctionObj)
      testInstructions(
        constant,
        (actual[index] as CompiledFunctionObj).instructions,
        testIndex
      )
    }
  })
}

const runCompilerTest = (tests: CompilerTestCase[]) => {
  tests.forEach(({ input, expectedConstants, expectedInstructions }, index) => {
    const program = parseProgram(input)

    const compiler = new Compiler()
    compiler.compile(program)

    const bytecode = compiler.bytecode

    testInstructions(expectedInstructions, bytecode.instructions, index)
    testConstants(expectedConstants, bytecode.constants, index)
  })
}

describe('compiler', () => {
  describe('compiling instructions', () => {
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

    describe('let statements', () => {
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
      test('let statement scopes', () => {
        const tests: CompilerTestCase[] = [
          {
            input: 'let num = 55; fn() { num }',
            expectedConstants: [
              55,
              [make(Opcodes.OpGetGlobal, 0), make(Opcodes.OpReturnValue)],
            ],
            expectedInstructions: [
              make(Opcodes.OpConstant, 0),
              make(Opcodes.OpSetGlobal, 0),
              make(Opcodes.OpClosure, 1, 0),
              make(Opcodes.OpPop),
            ],
          },
          {
            input: `fn() {
              let num = 55;
              num
            }
            `,
            expectedConstants: [
              55,
              [
                make(Opcodes.OpConstant, 0),
                make(Opcodes.OpSetLocal, 0),
                make(Opcodes.OpGetLocal, 0),
                make(Opcodes.OpReturnValue),
              ],
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 1, 0),
              make(Opcodes.OpPop),
            ],
          },
          {
            input: `
            fn() {
                let a = 55;
                let b = 77;
                a + b
            }
            `,
            expectedConstants: [
              55,
              77,
              [
                make(Opcodes.OpConstant, 0),
                make(Opcodes.OpSetLocal, 0),
                make(Opcodes.OpConstant, 1),
                make(Opcodes.OpSetLocal, 1),
                make(Opcodes.OpGetLocal, 0),
                make(Opcodes.OpGetLocal, 1),
                make(Opcodes.OpAdd),
                make(Opcodes.OpReturnValue),
              ],
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 2, 0),
              make(Opcodes.OpPop),
            ],
          },
        ]
        runCompilerTest(tests)
      })
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

    // eslint-disable-next-line jest/expect-expect
    test('index expressions', () => {
      const tests: CompilerTestCase[] = [
        {
          input: '[1, 2,3][1 + 1]',
          expectedConstants: [1, 2, 3, 1, 1],
          expectedInstructions: [
            make(Opcodes.OpConstant, 0),
            make(Opcodes.OpConstant, 1),
            make(Opcodes.OpConstant, 2),
            make(Opcodes.OpArray, 3),
            make(Opcodes.OpConstant, 3),
            make(Opcodes.OpConstant, 4),
            make(Opcodes.OpAdd),
            make(Opcodes.OpIndex),
            make(Opcodes.OpPop),
          ],
        },
        {
          input: '{1: 2}[2 - 1]',
          expectedConstants: [1, 2, 2, 1],
          expectedInstructions: [
            make(Opcodes.OpConstant, 0),
            make(Opcodes.OpConstant, 1),
            make(Opcodes.OpHash, 2),
            make(Opcodes.OpConstant, 2),
            make(Opcodes.OpConstant, 3),
            make(Opcodes.OpSub),
            make(Opcodes.OpIndex),
            make(Opcodes.OpPop),
          ],
        },
      ]
      runCompilerTest(tests)
    })

    describe('functions', () => {
      // eslint-disable-next-line jest/expect-expect
      test('function definitions', () => {
        const tests: CompilerTestCase[] = [
          {
            input: 'fn() { return 5 + 10 }',
            expectedConstants: [
              5,
              10,
              [
                make(Opcodes.OpConstant, 0),
                make(Opcodes.OpConstant, 1),
                make(Opcodes.OpAdd),
                make(Opcodes.OpReturnValue),
              ],
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 2, 0),
              make(Opcodes.OpPop),
            ],
          },
          {
            input: 'fn() { 5 + 10 }',
            expectedConstants: [
              5,
              10,
              [
                make(Opcodes.OpConstant, 0),
                make(Opcodes.OpConstant, 1),
                make(Opcodes.OpAdd),
                make(Opcodes.OpReturnValue),
              ],
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 2, 0),
              make(Opcodes.OpPop),
            ],
          },
          {
            input: 'fn() { 1; 2 }',
            expectedConstants: [
              1,
              2,
              [
                make(Opcodes.OpConstant, 0),
                make(Opcodes.OpPop),
                make(Opcodes.OpConstant, 1),
                make(Opcodes.OpReturnValue),
              ],
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 2, 0),
              make(Opcodes.OpPop),
            ],
          },
          {
            input: 'fn() { }',
            expectedConstants: [[make(Opcodes.OpReturn)]],
            expectedInstructions: [
              make(Opcodes.OpClosure, 0, 0),
              make(Opcodes.OpPop),
            ],
          },
        ]
        runCompilerTest(tests)
      })

      // eslint-disable-next-line jest/expect-expect
      test('function calls', () => {
        const tests: CompilerTestCase[] = [
          {
            input: 'fn() { 24 }()',
            expectedConstants: [
              24,
              [
                make(Opcodes.OpConstant, 0), // the literal 24
                make(Opcodes.OpReturnValue),
              ],
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 1, 0), // the compiled funciton
              make(Opcodes.OpCall, 0),
              make(Opcodes.OpPop),
            ],
          },
          {
            input: 'let noArg = fn() { 24 }; noArg();',
            expectedConstants: [
              24,
              [
                make(Opcodes.OpConstant, 0), // the literal 24
                make(Opcodes.OpReturnValue),
              ],
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 1, 0), // the compiled funciton
              make(Opcodes.OpSetGlobal, 0),
              make(Opcodes.OpGetGlobal, 0),
              make(Opcodes.OpCall, 0),
              make(Opcodes.OpPop),
            ],
          },
          {
            input: 'let oneArg = fn(a) { a }; oneArg(24);',
            expectedConstants: [
              [make(Opcodes.OpGetLocal, 0), make(Opcodes.OpReturnValue)],
              24,
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 0, 0),
              make(Opcodes.OpSetGlobal, 0),
              make(Opcodes.OpGetGlobal, 0),
              make(Opcodes.OpConstant, 1),
              make(Opcodes.OpCall, 1),
              make(Opcodes.OpPop),
            ],
          },
          {
            input:
              'let manyArg = fn(a, b, c) { a; b; c; }; manyArg(24, 25, 26);',
            expectedConstants: [
              [
                make(Opcodes.OpGetLocal, 0),
                make(Opcodes.OpPop),
                make(Opcodes.OpGetLocal, 1),
                make(Opcodes.OpPop),
                make(Opcodes.OpGetLocal, 2),
                make(Opcodes.OpReturnValue),
              ],
              24,
              25,
              26,
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 0, 0),
              make(Opcodes.OpSetGlobal, 0),
              make(Opcodes.OpGetGlobal, 0),
              make(Opcodes.OpConstant, 1),
              make(Opcodes.OpConstant, 2),
              make(Opcodes.OpConstant, 3),
              make(Opcodes.OpCall, 3),
              make(Opcodes.OpPop),
            ],
          },
        ]
        runCompilerTest(tests)
      })

      // eslint-disable-next-line jest/expect-expect
      test('builtins', () => {
        const tests: CompilerTestCase[] = [
          {
            input: 'len([]); push([], 1)',
            expectedConstants: [1],
            expectedInstructions: [
              make(Opcodes.OpGetBuiltin, 0),
              make(Opcodes.OpArray, 0),
              make(Opcodes.OpCall, 1),
              make(Opcodes.OpPop),
              make(Opcodes.OpGetBuiltin, 5),
              make(Opcodes.OpArray, 0),
              make(Opcodes.OpConstant, 0),
              make(Opcodes.OpCall, 2),
              make(Opcodes.OpPop),
            ],
          },
          {
            input: 'fn() { len([]) }',
            expectedConstants: [
              [
                make(Opcodes.OpGetBuiltin, 0),
                make(Opcodes.OpArray, 0),
                make(Opcodes.OpCall, 1),
                make(Opcodes.OpReturnValue),
              ],
            ],
            expectedInstructions: [
              make(Opcodes.OpClosure, 0, 0),
              make(Opcodes.OpPop),
            ],
          },
        ]
        runCompilerTest(tests)
      })
    })

    // eslint-disable-next-line jest/expect-expect
    test('closures', () => {
      const tests: CompilerTestCase[] = [
        {
          input: `
            fn(a) {
              fn (b) {
                a + b
              }
            }
          `,
          expectedConstants: [
            [
              make(Opcodes.OpGetFree, 0),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpAdd),
              make(Opcodes.OpReturnValue),
            ],
            [
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpClosure, 0, 1),
              make(Opcodes.OpReturnValue),
            ],
          ],
          expectedInstructions: [
            make(Opcodes.OpClosure, 1, 0),
            make(Opcodes.OpPop),
          ],
        },
        // failing test for a broken(?) vm test
        {
          input: `
            let newClosure = fn(a) {
              fn() { a; };
            };
            let closure = newClosure(99);
            closure()
          `,
          expectedConstants: [
            [make(Opcodes.OpGetFree, 0), make(Opcodes.OpReturnValue)],
            [
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpClosure, 0, 1),
              make(Opcodes.OpReturnValue),
            ],
            99,
          ],
          expectedInstructions: [
            make(Opcodes.OpClosure, 1, 0),
            make(Opcodes.OpSetGlobal, 0),
            make(Opcodes.OpGetGlobal, 0),
            make(Opcodes.OpConstant, 2),
            make(Opcodes.OpCall, 1),
            make(Opcodes.OpSetGlobal, 1),
            make(Opcodes.OpGetGlobal, 1),
            make(Opcodes.OpCall, 0),
            make(Opcodes.OpPop),
          ],
        },
        {
          input: `
            fn(a) {
              fn (b) {
                fn (c) {
                  a + b + c
                }
              }
            }
          `,
          expectedConstants: [
            [
              make(Opcodes.OpGetFree, 0),
              make(Opcodes.OpGetFree, 1),
              make(Opcodes.OpAdd),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpAdd),
              make(Opcodes.OpReturnValue),
            ],
            [
              make(Opcodes.OpGetFree, 0),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpClosure, 0, 2),
              make(Opcodes.OpReturnValue),
            ],
            [
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpClosure, 1, 1),
              make(Opcodes.OpReturnValue),
            ],
          ],
          expectedInstructions: [
            make(Opcodes.OpClosure, 2, 0),
            make(Opcodes.OpPop),
          ],
        },
        {
          input: `
            fn(a) {
              fn (b) {
                fn (c) {
                  a + b + c
                }
              }
            }
          `,
          expectedConstants: [
            [
              make(Opcodes.OpGetFree, 0),
              make(Opcodes.OpGetFree, 1),
              make(Opcodes.OpAdd),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpAdd),
              make(Opcodes.OpReturnValue),
            ],
            [
              make(Opcodes.OpGetFree, 0),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpClosure, 0, 2),
              make(Opcodes.OpReturnValue),
            ],
            [
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpClosure, 1, 1),
              make(Opcodes.OpReturnValue),
            ],
          ],
          expectedInstructions: [
            make(Opcodes.OpClosure, 2, 0),
            make(Opcodes.OpPop),
          ],
        },
        {
          input: `
          let global = 55;

          fn() {
              let a = 66;

              fn() {
                  let b = 77;

                  fn() {
                      let c = 88;

                      global + a + b + c;
                  }
              }
          }
          `,
          expectedConstants: [
            55,
            66,
            77,
            88,
            [
              make(Opcodes.OpConstant, 3),
              make(Opcodes.OpSetLocal, 0),
              make(Opcodes.OpGetGlobal, 0),
              make(Opcodes.OpGetFree, 0),
              make(Opcodes.OpAdd),
              make(Opcodes.OpGetFree, 1),
              make(Opcodes.OpAdd),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpAdd),
              make(Opcodes.OpReturnValue),
            ],
            [
              make(Opcodes.OpConstant, 2),
              make(Opcodes.OpSetLocal, 0),
              make(Opcodes.OpGetFree, 0),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpClosure, 4, 2),
              make(Opcodes.OpReturnValue),
            ],
            [
              make(Opcodes.OpConstant, 1),
              make(Opcodes.OpSetLocal, 0),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpClosure, 5, 1),
              make(Opcodes.OpReturnValue),
            ],
          ],
          expectedInstructions: [
            make(Opcodes.OpConstant, 0),
            make(Opcodes.OpSetGlobal, 0),
            make(Opcodes.OpClosure, 6, 0),
            make(Opcodes.OpPop),
          ],
        },
      ]
      runCompilerTest(tests)
    })

    // eslint-disable-next-line jest/expect-expect
    test('function definitions', () => {
      const tests: CompilerTestCase[] = [
        {
          input: 'let countDown = fn(x) { countDown(x - 1); }; countDown(1);',
          expectedConstants: [
            1,
            [
              make(Opcodes.OpCurrentClosure),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpConstant, 0),
              make(Opcodes.OpSub),
              make(Opcodes.OpCall, 1),
              make(Opcodes.OpReturnValue),
            ],
            1,
          ],
          expectedInstructions: [
            make(Opcodes.OpClosure, 1, 0),
            make(Opcodes.OpSetGlobal, 0),
            make(Opcodes.OpGetGlobal, 0),
            make(Opcodes.OpConstant, 2),
            make(Opcodes.OpCall, 1),
            make(Opcodes.OpPop),
          ],
        },
        {
          input: `
            let wrapper = fn() {
                let countDown = fn(x) { countDown(x - 1); };
                countDown(1);
            };
            wrapper();
          `,
          expectedConstants: [
            1,
            [
              make(Opcodes.OpCurrentClosure),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpConstant, 0),
              make(Opcodes.OpSub),
              make(Opcodes.OpCall, 1),
              make(Opcodes.OpReturnValue),
            ],
            1,
            [
              make(Opcodes.OpClosure, 1, 0),
              make(Opcodes.OpSetLocal, 0),
              make(Opcodes.OpGetLocal, 0),
              make(Opcodes.OpConstant, 2),
              make(Opcodes.OpCall, 1),
              make(Opcodes.OpReturnValue),
            ],
          ],
          expectedInstructions: [
            make(Opcodes.OpClosure, 3, 0),
            make(Opcodes.OpSetGlobal, 0),
            make(Opcodes.OpGetGlobal, 0),
            make(Opcodes.OpCall, 0),
            make(Opcodes.OpPop),
          ],
        },
      ]
      runCompilerTest(tests)
    })
  })

  describe('compiler scopes', () => {
    test('entering and exiting scope', () => {
      const compiler = new Compiler()
      expect(compiler.scopeIndex).toEqual(0)
      const globalSymbolTable = compiler.symbolTable

      compiler.emit(Opcodes.OpMul)

      compiler.enterScope()
      expect(compiler.scopeIndex).toEqual(1)

      compiler.emit(Opcodes.OpSub)

      const probsSub = compiler.scopes[compiler.scopeIndex].lastInstruction
      expect(probsSub.opcode).toEqual(Opcodes.OpSub)

      // compiler should enclose
      expect(compiler.symbolTable.outer).toEqual(globalSymbolTable)

      compiler.leaveScope()
      expect(compiler.scopeIndex).toEqual(0)

      // should check that they're identical objects in memory
      expect(compiler.symbolTable).toBe(globalSymbolTable)
      expect(compiler.symbolTable.outer).toBeUndefined()

      compiler.emit(Opcodes.OpAdd)
      expect(compiler.scopes[compiler.scopeIndex].instructions).toHaveLength(2)

      const probsAdd = compiler.scopes[compiler.scopeIndex].lastInstruction
      expect(probsAdd.opcode).toEqual(Opcodes.OpAdd)

      const previous = compiler.scopes[compiler.scopeIndex].previousInstruction
      expect(previous.opcode).toEqual(Opcodes.OpMul)
    })
  })
})
