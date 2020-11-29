import {
  FunctionObj,
  StringObj,
  IntegerObj,
  ArrayObj,
  HashObj,
  TRUE,
  FALSE,
} from '../object'

import {
  testIntegerObj,
  testErrorObj,
  testBooleanObj,
  testNullObj,
  testNumberArray,
  testStringObj,
  testEval,
} from './helpers'

describe('evaulator', () => {
  // eslint-disable-next-line jest/expect-expect
  it('should evaluate integer expressions', () => {
    const tests: Array<[string, number]> = [
      ['10', 10],
      ['5', 5],
      ['-5', -5],
      ['-10', -10],
      ['5 + 5 + 5 + 5 - 10', 10],
      ['2 * 2 * 2 * 2 * 2', 32],
      ['-50 + 100 + -50', 0],
      ['5 * 2 + 10', 20],
      ['5 + 2 * 10', 25],
      ['20 + 2 * -10', 0],
      ['50 / 2 * 2 + 10', 60],
      ['2 * (5 + 10)', 30],
      ['3 * 3 * 3 + 10', 37],
      ['3 * (3 * 3) + 10', 37],
      ['(5 + 10 * 2 + 15 / 3) * 2 + -10', 50],
    ]

    tests.forEach(([input, expected]) => {
      testIntegerObj(testEval(input), expected)
    })
  })

  // eslint-disable-next-line jest/expect-expect
  it('should evaluate boolean expressions', () => {
    const tests: Array<[string, boolean]> = [
      ['true', true],
      ['false', false],
      ['1 < 2', true],
      ['1 > 2', false],
      ['1 < 1', false],
      ['1 > 1', false],
      ['1 == 1', true],
      ['1 != 1', false],
      ['1 == 2', false],
      ['1 != 2', true],
      ['true == true', true],
      ['false == false', true],
      ['true == false', false],
      ['true != false', true],
      ['false != true', true],
      ['(1 < 2) == true', true],
      ['(1 < 2) == false', false],
      ['(1 > 2) == true', false],
      ['(1 > 2) == false', true],
    ]

    tests.forEach(([input, expected]) => {
      testBooleanObj(testEval(input), expected)
    })
  })

  // eslint-disable-next-line jest/expect-expect
  it('should evaluate !prefix expressions', () => {
    const tests: Array<[string, boolean]> = [
      ['!true', false],
      ['!false', true],
      ['!5', false],
      ['!!true', true],
      ['!!false', false],
      ['!!5', true],
    ]

    tests.forEach(([input, expected]) => {
      testBooleanObj(testEval(input), expected)
    })
  })

  // eslint-disable-next-line jest/expect-expect
  it('should evaluate if expressions', () => {
    const tests: Array<[string, number | null]> = [
      ['if (true) { 10 }', 10],
      ['if (false) { 10 }', null],
      ['if (1) { 10 }', 10],
      ['if (1 < 2) { 10 }', 10],
      ['if (1 > 2) { 10 }', null],
      ['if (1 > 2) { 10 } else { 20 }', 20],
      ['if (1 < 2) { 10 } else { 20 }', 10],
    ]

    tests.forEach(([input, expected]) => {
      const output = testEval(input)
      const func = expected ? testIntegerObj : testNullObj
      func(output, expected)
    })
  })

  // eslint-disable-next-line jest/expect-expect
  it('should evaluate return expressions', () => {
    const tests: Array<[string, number]> = [
      ['return 10;', 10],
      ['return 10; 9;', 10],
      ['return 2 * 5; 9;', 10],
      ['9; return 2 * 5; 9;', 10],
      [
        `
        if (10 > 1) {
          if (10 > 1) {
            return 10;
          }
          return 1;
        }
      `.trim(),
        10,
      ],
    ]

    tests.forEach(([input, expected]) => {
      testIntegerObj(testEval(input), expected)
    })
  })

  // eslint-disable-next-line jest/expect-expect
  it('should throw nice error messages', () => {
    const tests: Array<[string, string]> = [
      ['5 + true;', 'ERROR: type mismatch: INTEGER + BOOLEAN'],
      ['5 + true; 5;', 'ERROR: type mismatch: INTEGER + BOOLEAN'],
      ['-true', 'ERROR: unknown operator: -BOOLEAN'],
      ['true + false;', 'ERROR: unknown operator: BOOLEAN + BOOLEAN'],
      ['5; true + false; 5', 'ERROR: unknown operator: BOOLEAN + BOOLEAN'],
      [
        'if (10 > 1) { true + false; }',
        'ERROR: unknown operator: BOOLEAN + BOOLEAN',
      ],
      [
        `
        if (10 > 1) {
          if (10 > 1) {
            return true + false;
          }
          return 1;
        }
        `.trim(),
        'ERROR: unknown operator: BOOLEAN + BOOLEAN',
      ],
      ['foobar', 'ERROR: identifier not found: foobar'],
      ['"Hello" - "World"', 'ERROR: unknown operator: STRING - STRING'],
    ]

    tests.forEach(([input, expected]) => {
      testErrorObj(testEval(input), expected)
    })
  })

  // eslint-disable-next-line jest/expect-expect
  it('should evaluate let statements', () => {
    const tests: Array<[string, number]> = [
      ['let a = 5; a;', 5],
      ['let a = 5 * 5; a;', 25],
      ['let a = 5; let b = a; b;', 5],
      ['let a = 5; let b = a; let c = a + b + 5; c;', 15],
    ]

    tests.forEach(([input, expected]) => {
      testIntegerObj(testEval(input), expected)
    })
  })

  describe('strings', () => {
    // eslint-disable-next-line jest/expect-expect
    it('should evaluate string literals', () => {
      testStringObj(testEval('"Hello World!"'), 'Hello World!')
    })

    // eslint-disable-next-line jest/expect-expect
    it('should concatenate string literals', () => {
      testStringObj(testEval('"Hello" + " " + "World!"'), 'Hello World!')
    })
  })

  describe('functions', () => {
    it('should build function objects', () => {
      const input = 'fn(x) { x + 2; };'
      const evaluated = testEval(input) as FunctionObj
      expect(evaluated).toBeInstanceOf(FunctionObj)
      expect(evaluated.parameters).toHaveLength(1)
      expect(evaluated.parameters[0].toString()).toEqual('x')
      expect(evaluated.body.toString()).toEqual('(x + 2)')
    })

    // eslint-disable-next-line jest/expect-expect
    it('should evaluate functions', () => {
      const tests: Array<[string, number]> = [
        ['let identity = fn(x) { x; }; identity(5);', 5],
        ['let identity = fn(x) { return x; }; identity(5);', 5],
        ['let double = fn(x) { x * 2; }; double(5);', 10],
        ['let add = fn(x, y) { x + y; }; add(5, 5);', 10],
        ['let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));', 20],
        ['fn(x) { x; }(5)', 5],
      ]

      tests.forEach(([input, expected]) => {
        testIntegerObj(testEval(input), expected)
      })
    })

    // eslint-disable-next-line jest/expect-expect
    it('should test closures', () => {
      const tests: Array<[string, number]> = [
        [
          `
          let newAdder = fn(x) {
            fn(y) { x + y };
          };

          let addTwo = newAdder(2);
          addTwo(2);
          `.trim(),
          4,
        ],
      ]

      tests.forEach(([input, expected]) => {
        testIntegerObj(testEval(input), expected)
      })
    })

    describe('builtin functions', () => {
      // eslint-disable-next-line jest/expect-expect
      it('should test builtin functions', () => {
        const tests: Array<[string, number]> = [
          ['len("")', 0],
          ['len("four")', 4],
          ['len("hello world")', 11],
          ['len([1, 2, 3])', 3],
          ['len([])', 0],
          ['first([1, 2, 3])', 1],
          ['last([1, 2, 3])', 3],
        ]

        tests.forEach(([input, expected]) => {
          testIntegerObj(testEval(input), expected)
        })
      })

      // eslint-disable-next-line jest/expect-expect
      it('should test builtin functions error handling', () => {
        const tests: Array<[string, string]> = [
          ['len(1)', 'ERROR: argument to "len" not supported, got INTEGER'],
          [
            'len("one", "two")',
            'ERROR: wrong number of arguments. got=2, want=1',
          ],
          ['first(1)', 'ERROR: argument to "first" must be ARRAY, got INTEGER'],
          ['last(1)', 'ERROR: argument to "last" must be ARRAY, got INTEGER'],
          [
            'push(1, 1)',
            'ERROR: argument to "push" must be ARRAY, got INTEGER',
          ],
          [
            '{"name": "Monkey"}[fn(x) { x }]',
            'ERROR: unusable as hash key: FUNCTION',
          ],
        ]

        tests.forEach(([input, expected]) => {
          try {
            testErrorObj(testEval(input), expected)
          } catch (e) {
            console.log(input)
            throw e
          }
        })
      })

      // eslint-disable-next-line jest/expect-expect
      it('should test builtin functions returning null', () => {
        const tests: string[] = [
          // ['puts("hello", "world!")', null],
          'first([])',
          'last([])',
          'rest([])',
        ]

        tests.forEach((input) => {
          testNullObj(testEval(input), null)
        })
      })

      // eslint-disable-next-line jest/expect-expect
      it('should test builtin functions that return arrays', () => {
        const tests: Array<[string, number[]]> = [
          ['rest([1, 2, 3])', [2, 3]],
          ['push([], 1)', [1]],
        ]

        tests.forEach(([input, expected]) => {
          testNumberArray(testEval(input) as ArrayObj, expected)
        })
      })
    })
  })

  describe('arrays', () => {
    // eslint-disable-next-line jest/expect-expect
    it('should evaluate array literals', () => {
      testNumberArray((testEval('[1, 2 * 2, 3 + 3]') as unknown) as ArrayObj, [
        1,
        4,
        6,
      ])
    })

    // eslint-disable-next-line jest/expect-expect
    it('should evaluate index expressions', () => {
      const tests: Array<{ input: string; expected: number | null }> = [
        {
          input: '[1, 2, 3][0]',
          expected: 1,
        },
        {
          input: '[1, 2, 3][1]',
          expected: 2,
        },
        {
          input: '[1, 2, 3][2]',
          expected: 3,
        },
        {
          input: 'let i = 0; [1][i];',
          expected: 1,
        },
        {
          input: '[1, 2, 3][1 + 1];',
          expected: 3,
        },
        {
          input: 'let myArray = [1, 2, 3]; myArray[2];',
          expected: 3,
        },
        {
          input:
            'let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];',
          expected: 6,
        },
        {
          input: 'let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]',
          expected: 2,
        },
        {
          input: '[1, 2, 3][3]',
          expected: null,
        },
        {
          input: '[1, 2, 3][-1]',
          expected: null,
        },
      ]

      tests.forEach(({ input, expected }) => {
        const output = testEval(input)
        const func = expected ? testIntegerObj : testNullObj
        func(output, expected)
      })
    })
  })

  describe('hashes', () => {
    it('should evaluate hash literals', () => {
      const input = `let two = "two";
      {
        "one": 10 - 9,
        two: 1 + 1,
        "thr" + "ee": 6 / 2,
        4: 4,
        true: 5,
        false: 6
      }`

      const result = testEval(input) as HashObj
      expect(result).toBeInstanceOf(HashObj)

      const expected = new Map<string, number>([
        [new StringObj('one').hashKey(), 1],
        [new StringObj('two').hashKey(), 2],
        [new StringObj('three').hashKey(), 3],
        [new IntegerObj(4).hashKey(), 4],
        [TRUE.hashKey(), 5],
        [FALSE.hashKey(), 6],
      ])

      expect(result.pairs.size).toEqual(expected.size)

      for (const [expectedKey, expectedValue] of expected) {
        // i only need the bang here because jest doesn't give me a typeguard
        const pair = result.pairs.get(expectedKey)!

        expect(pair).toBeDefined()

        testIntegerObj(pair.value, expectedValue)
      }
    })
  })

  // eslint-disable-next-line jest/expect-expect
  it('should evaluate hash index expressions', () => {
    const tests = [
      {
        input: '{"foo": 5}["foo"]',
        expected: 5,
      },
      {
        input: '{"foo": 5}["bar"]',
        expected: null,
      },
      {
        input: 'let key = "foo"; {"foo": 5}[key]',
        expected: 5,
      },
      {
        input: '{}["foo"]',
        expected: null,
      },
      {
        input: '{5: 5}[5]',
        expected: 5,
      },
      {
        input: '{true: 5}[true]',
        expected: 5,
      },
      {
        input: '{false: 5}[false]',
        expected: 5,
      },
    ]

    tests.forEach(({ input, expected }) => {
      const evaluated = testEval(input)
      if (expected) {
        testIntegerObj(evaluated, expected)
      } else {
        testNullObj(evaluated, expected)
      }
    })
  })
})

// juice
// dust
// crunch
// plummet
