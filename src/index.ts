#!/usr/bin/env node

import repl from './repl'

const main = (): void => {
  console.log('Hello! This is the Monkey programming language')
  console.log('Feel free to type in commands')
  repl()
}

main()
