import * as repl from 'repl'
import { Lexer } from './lexer'
import { TOKENS } from './token'

const lineToTokens = (
  line: string,
  context: any, // who knows what these are for
  filename: any, // who knows what these are for
  callback: (err: Error | null, content?: any) => void
) => {
  const l = new Lexer(line)
  for (let tok = l.nextToken(); tok.type !== TOKENS.EOF; tok = l.nextToken()) {
    console.log(tok)
  }
  callback(null)
}

export default () => {
  repl.start({
    prompt: '>> ',
    eval: lineToTokens
  })
}
