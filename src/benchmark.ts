import { Compiler } from './compiler'
import { Environment } from './environment'
import { evaluate } from './evaluator'
import { Lexer } from './lexer'
import { Parser } from './parser'
import { VM } from './vm'

const numLoops = 30

const input = `
let fibonacci = fn(x) {
  if (x == 0) {
    0
  } else {
    if (x == 1) {
      return 1;
    } else {
      fibonacci(x - 1) + fibonacci(x - 2);
    }
  }
};
fibonacci(${numLoops});`

const l = new Lexer(input)
const p = new Parser(l)
const program = p.parseProgram()

const args = process.argv.slice(2)
const mode = args[0] as 'eval' | 'vm'
if (args.length > 1 || !['eval', 'vm'].includes(mode)) {
  throw new Error('only provide a single input: "vm" or "eval"')
}
let duration, result

if (mode === 'vm') {
  const comp = new Compiler()
  comp.compile(program)

  const machine = new VM(comp.bytecode)

  const start = process.hrtime()
  machine.run()
  result = machine.lastPoppedStackElement
  duration = process.hrtime(start)[0]
} else {
  const env = new Environment()
  const start = process.hrtime()
  result = evaluate(program, env)
  duration = process.hrtime(start)[0]
}

console.log(
  `fib(${numLoops})\n\nEngine: ${mode}\nResult: ${result}\nDuration: ~${duration}s\n`
)
