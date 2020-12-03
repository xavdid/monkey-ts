import { Compiler } from '../compiler'
import { BaseObject } from '../object'
import { VM } from '../vm'
import { parseProgram, testIntegerObj } from './helpers'

interface VMTest {
  input: string
  expected: any
}

const testExpectedObject = (actual: BaseObject | undefined, expected: any) => {
  if (!actual) {
    throw new Error('actual does not exist')
  }
  if (typeof expected === 'number') {
    testIntegerObj(actual, expected)
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
})
