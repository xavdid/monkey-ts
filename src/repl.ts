import { start } from 'repl' // native node module
import { Lexer } from './lexer'
import { Parser } from './parser'

const lineToTokens = (
  line: string,
  context: any, // who knows what these are for
  filename: any, // who knows what these are for
  callback: (err: Error | null, content?: any) => void
) => {
  const l = new Lexer(line)
  const p = new Parser(l)

  const program = p.parseProgram()

  console.log(program.toString(), '\n')

  callback(null)
}

export default () => {
  start({
    prompt: '>> ',
    eval: lineToTokens,
  })
}
