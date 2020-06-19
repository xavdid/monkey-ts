#!/usr/bin/env node

import repl from './repl'

const main = (): void => {
  console.log('Hello! This is the Monkey programming language')
  console.log('Feel free to type in commands')
  repl()
}

if (require.main === module) {
  // could take input as well? like, a filepath?
  main()
}
