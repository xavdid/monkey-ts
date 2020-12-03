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
    testExpectedObject(vm.lastPoppedStackElement, expected)
  })
}

describe('vm', () => {
  // eslint-disable-next-line jest/expect-expect
  test('integer arithmetic', () => {
    const tests: VMTest[] = [
      // { input: '1', expected: 1 },
      // { input: '2', expected: 2 },
      { input: '1 + 2', expected: 3 },
    ]
    runVmTests(tests)
  })
})
