import { Compiler } from '../compiler'
import { ArrayObj, BaseObject, IntegerObj, HashObj } from '../object'
import { VM } from '../vm'
import {
  parseProgram,
  testBooleanObj,
  testIntegerObj,
  testStringObj,
} from './helpers'

interface VMTest {
  input: string
  expected: any
}

const testExpectedObject = (
  actual: BaseObject | undefined,
  expected: any
): void => {
  if (actual === undefined) {
    throw new Error(
      `VM didn't pop an object, should have been ${expected} (${typeof expected})`
    )
  }
  if (typeof expected === 'number') {
    testIntegerObj(actual, expected)
  } else if (typeof expected === 'boolean') {
    testBooleanObj(actual, expected)
  } else if (expected == null) {
    expect(actual.value).toBeNull()
  } else if (typeof expected === 'string') {
    testStringObj(actual, expected)
  } else if (Array.isArray(expected)) {
    expect(actual).toBeInstanceOf(ArrayObj)
    const arr = actual as ArrayObj
    expect(arr.elements).toHaveLength(expected.length)
    arr.elements.forEach((element, index) => {
      testExpectedObject(element, expected[index])
    })
  } else if (expected instanceof Map) {
    expect(actual).toBeInstanceOf(HashObj)
    const hash = actual as HashObj
    expect(hash.pairs.size).toEqual(expected.size)
    for (const [expectedKey, expectedValue] of expected as Map<
      string,
      number
    >) {
      const pair = hash.pairs.get(expectedKey)! // about to assert that it's defined, so the ! is cool
      expect(pair).toBeDefined()
      testExpectedObject(pair.value, expectedValue)
    }
  } else {
    throw new Error(`Unknown object type: ${expected}`)
  }
}

const runVmTests = (tests: VMTest[]) => {
  tests.forEach(({ input, expected }) => {
    const program = parseProgram(input)
    const comp = new Compiler()
    comp.compile(program)

    const vm = new VM(comp.bytecode)
    vm.run()
    try {
      testExpectedObject(vm.lastPoppedStackElement, expected)
    } catch (e) {
      console.log(`failed on input: "${input}"`)
      throw e
    }
  })
}

describe('vm', () => {
  // eslint-disable-next-line jest/expect-expect
  test('integer arithmetic', () => {
    const tests: VMTest[] = [
      { input: '1', expected: 1 },
      { input: '2', expected: 2 },
      { input: '1 + 2', expected: 3 },
      { input: '1 - 2', expected: -1 },
      { input: '1 * 2', expected: 2 },
      { input: '4 / 2', expected: 2 },
      { input: '50 / 2 * 2 + 10 - 5', expected: 55 },
      { input: '5 + 5 + 5 + 5 - 10', expected: 10 },
      { input: '2 * 2 * 2 * 2 * 2', expected: 32 },
      { input: '5 * 2 + 10', expected: 20 },
      { input: '5 + 2 * 10', expected: 25 },
      { input: '5 * (2 + 10)', expected: 60 },
      { input: '-5', expected: -5 },
      { input: '-10', expected: -10 },
      { input: '-50 + 100 + -50', expected: 0 },
      { input: '(5 + 10 * 2 + 15 / 3) * 2 + -10', expected: 50 },
    ]
    runVmTests(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('boolean expressions', () => {
    const tests: VMTest[] = [
      { input: 'true', expected: true },
      { input: 'false', expected: false },
      { input: '1 < 2', expected: true },
      { input: '1 > 2', expected: false },
      { input: '1 < 1', expected: false },
      { input: '1 > 1', expected: false },
      { input: '1 == 1', expected: true },
      { input: '1 != 1', expected: false },
      { input: '1 == 2', expected: false },
      { input: '1 != 2', expected: true },
      { input: 'true == true', expected: true },
      { input: 'false == false', expected: true },
      { input: 'true == false', expected: false },
      { input: 'true != false', expected: true },
      { input: 'false != true', expected: true },
      { input: '(1 < 2) == true', expected: true },
      { input: '(1 < 2) == false', expected: false },
      { input: '(1 > 2) == true', expected: false },
      { input: '(1 > 2) == false', expected: true },
      { input: '!true', expected: false },
      { input: '!false', expected: true },
      { input: '!5', expected: false },
      { input: '!!true', expected: true },
      { input: '!!false', expected: false },
      { input: '!!5', expected: true },
      { input: '!(if (false) { 5; })', expected: true },
    ]
    runVmTests(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('conditional expressions', () => {
    const tests: VMTest[] = [
      { input: 'if (true) { 10 }', expected: 10 },
      { input: 'if (true) { 10 } else { 20 }', expected: 10 },
      { input: 'if (false) { 10 } else { 20 }', expected: 20 },
      { input: 'if (1) { 10 }', expected: 10 },
      { input: 'if (1 < 2) { 10 }', expected: 10 },
      { input: 'if (1 < 2) { 10 } else { 20 }', expected: 10 },
      { input: 'if (1 > 2) { 10 } else { 20 }', expected: 20 },
      { input: 'if (1 > 2) { 10 }', expected: null },
      { input: 'if (false) { 10 }', expected: null },
      { input: 'if ((if (false) { 10 })) { 10 } else { 20 }', expected: 20 },
    ]
    runVmTests(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('global let statements', () => {
    const tests: VMTest[] = [
      { input: 'let one = 1; one', expected: 1 },
      { input: 'let one = 1; let two = 2; one + two', expected: 3 },
      { input: 'let one = 1; let two = one + one; one + two', expected: 3 },
    ]
    runVmTests(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('string expressions', () => {
    const tests: VMTest[] = [
      { input: '"monkey"', expected: 'monkey' },
      { input: '"mon" + "key"', expected: 'monkey' },
      { input: '"mon" + "key" + "banana"', expected: 'monkeybanana' },
    ]
    runVmTests(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('array literals', () => {
    const tests: VMTest[] = [
      { input: '[]', expected: [] },
      { input: '[1, 2, 3]', expected: [1, 2, 3] },
      { input: '[1 + 2, 3 * 4, 5 + 6]', expected: [3, 12, 11] },
    ]
    runVmTests(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('hash literals', () => {
    const tests: VMTest[] = [
      { input: '{}', expected: new Map() },
      {
        input: '{1: 2, 2: 3}',
        expected: new Map<string, number>([
          [new IntegerObj(1).hashKey(), 2],
          [new IntegerObj(2).hashKey(), 3],
        ]),
      },
      {
        input: '{1 + 1: 2 * 2, 3 + 3: 4 * 4}',
        expected: new Map<string, number>([
          [new IntegerObj(2).hashKey(), 4],
          [new IntegerObj(6).hashKey(), 16],
        ]),
      },
    ]
    runVmTests(tests)
  })

  // eslint-disable-next-line jest/expect-expect
  test('index expressions', () => {
    const tests: VMTest[] = [
      { input: '[1, 2, 3][1]', expected: 2 },
      { input: '[1, 2, 3][0 + 2]', expected: 3 },
      { input: '[[1, 1, 1]][0][0]', expected: 1 },
      { input: '[][0]', expected: null },
      { input: '[1, 2, 3][99]', expected: null },
      { input: '[1][-1]', expected: null },
      { input: '{1: 1, 2: 2}[1]', expected: 1 },
      { input: '{1: 1, 2: 2}[2]', expected: 2 },
      { input: '{1: 1}[0]', expected: null },
      { input: '{}[0]', expected: null },
      { input: '{"one": 1, "two": 2, "three": 3}["o" + "ne"]', expected: 1 },
    ]
    runVmTests(tests)
  })

  describe('functions', () => {
    // eslint-disable-next-line jest/expect-expect
    test('calling without arguments', () => {
      const tests: VMTest[] = [
        {
          input: 'let fivePlusTen = fn() { 5 + 10; }; fivePlusTen();',
          expected: 15,
        },
        {
          input: `
          let one = fn() { 1; };
          let two = fn() { 2; };
          one() + two()
          `,
          expected: 3,
        },
        {
          input: `
          let a = fn() { 1 };
          let b = fn() { a() + 1 };
          let c = fn() { b() + 1 };
          c();
          `,
          expected: 3,
        },
        {
          input: `
          let earlyExit = fn() { return 99; 100; };
          earlyExit();
          `,
          expected: 99,
        },
        {
          input: `
          let earlyExit = fn() { return 99; return 100; };
          earlyExit();
          `,
          expected: 99,
        },
        {
          input: `
          let noReturn = fn() { };
          noReturn();
          `,
          expected: null,
        },
        {
          input: `
          let noReturn = fn() { };
          let noReturnTwo = fn() { noReturn(); };
          noReturn();
          noReturnTwo();
          `,
          expected: null,
        },
      ]
      runVmTests(tests)
    })

    // eslint-disable-next-line jest/expect-expect
    test('first class functions', () => {
      const tests: VMTest[] = [
        {
          input: `let returnsOne = fn() { 1; };
          let returnsOneReturner = fn() { returnsOne; };
          returnsOneReturner()();`,
          expected: 1,
        },
      ]
      runVmTests(tests)
    })
  })
})
