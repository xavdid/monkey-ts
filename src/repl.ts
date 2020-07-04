import { start } from 'repl' // native node module
import { Lexer } from './lexer'
import { Parser } from './parser'
import { evaluate } from './evaluator'
import { Environment } from './environment'

// needs to be out here so it's reused across lines
// also means its global across requires, which might be bad
const env = new Environment()

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

  // actual evaluates everything
  const output = evaluate(program, env)
  if (output.value) {
    console.log(output.toString())
  }

  callback(null)
}

export default () => {
  start({
    prompt: '>> ',
    eval: lineToTokens,
  })
}
