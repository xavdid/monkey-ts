import { Lexer } from '../lexer'
import { Parser } from '../parser'

import { evaluate } from '../evaluator'
import { ErrorObj, FunctionObj } from '../object'
import { Environment } from '../environment'

const testEval = (input: string) => {
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  const env = new Environment()

  return evaluate(program, env)
}

describe('evaulator', () => {
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
      expect(testEval(input).value).toEqual(expected)
    })
  })

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
      expect(testEval(input).value).toEqual(expected)
    })
  })

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
      expect(testEval(input).value).toEqual(expected)
    })
  })

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
      expect(testEval(input).value).toEqual(expected)
    })
  })

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
      expect(testEval(input).value).toEqual(expected)
    })
  })

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
    ]

    tests.forEach(([input, expected]) => {
      const output = testEval(input)

      expect(output).toBeInstanceOf(ErrorObj)
      expect(output.toString()).toEqual(expected)
    })
  })

  it('should evaluate let statements', () => {
    const tests: Array<[string, number]> = [
      ['let a = 5; a;', 5],
      ['let a = 5 * 5; a;', 25],
      ['let a = 5; let b = a; b;', 5],
      ['let a = 5; let b = a; let c = a + b + 5; c;', 15],
    ]

    tests.forEach(([input, expected]) => {
      expect(testEval(input).value).toEqual(expected)
    })
  })

  describe('functions', () => {
    it('should build function objects', () => {
      const input = 'fn(x) { x + 2; };'
      const evaluated = testEval(input) as FunctionObj
      expect(evaluated).toBeInstanceOf(FunctionObj)
      expect(evaluated.parameters.length).toEqual(1)
      expect(evaluated.parameters[0].toString()).toEqual('x')
      expect(evaluated.body.toString()).toEqual('(x + 2)')
    })

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
        expect(testEval(input).value).toEqual(expected)
      })
    })

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
        expect(testEval(input).value).toEqual(expected)
      })
    })
  })
})
