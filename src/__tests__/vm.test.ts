import { Compiler } from '../compiler'
import { BaseObject } from '../object'
import { VM } from '../vm'
import { parseProgram, testBooleanObj, testIntegerObj } from './helpers'

interface VMTest {
  input: string
  expected: any
}

const testExpectedObject = (
  actual: BaseObject | undefined,
  expected: any
): void => {
  if (actual === undefined) {
    throw new Error('actual does not exist')
  }
  if (typeof expected === 'number') {
    testIntegerObj(actual, expected)
  } else if (typeof expected === 'boolean') {
    testBooleanObj(actual, expected)
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
    ]
    runVmTests(tests)
  })
})
