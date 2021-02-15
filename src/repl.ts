import { start } from 'repl' // native node module
import { Lexer } from './lexer'
import { Parser } from './parser'
import { evaluate } from './evaluator'
import { Environment } from './environment'
import { Compiler } from './compiler'
import { VM } from './vm'

// needs to be out here so it's reused across lines
// also means its global across requires, which might be bad
const env = new Environment()

const USE_COMPILER = true

const lineToTokens = (
  line: string,
  context: any, // who knows what these are for
  filename: any, // who knows what these are for
  callback: (err: Error | null, content?: any) => void
) => {
  const l = new Lexer(line)
  const p = new Parser(l)

  const program = p.parseProgram()

  // prints a nicely wrapped program:
  // console.log(program.toString(), '\n')

  if (USE_COMPILER) {
    // run using compiler
    const comp = new Compiler()
    comp.compile(program)

    const machine = new VM(comp.bytecode)
    machine.run()

    const stackTop = machine.lastPoppedStackElement
    console.log(stackTop?.toString())
  } else {
    // run using interpreter
    // actually evaluates everything
    const output = evaluate(program, env)
    if (output.primitive !== 'null') {
      console.log(output.toString())
    }
  }
  callback(null)
}

export default () => {
  console.log(`Running using ${USE_COMPILER ? 'compiler' : 'interpreter'}`)
  start({
    prompt: '>> ',
    eval: lineToTokens,
  })
}
