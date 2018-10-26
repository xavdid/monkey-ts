export type tokenType = string

export class Token {
  type: tokenType // in the book, this is a separate type
  literal: string
  constructor(type: tokenType, lilteral: string) {
    this.type = type
    this.literal = lilteral
  }
}

export const enum TOKENS {
  ILLEGAL = 'ILLEGAL',

  EOF = 'EOF',

  // Identifiers + literals
  IDENT = 'IDENT', // add, foobar, x, y, ...
  INT = 'INT', // 1343456

  // Operators
  ASSIGN = '=',
  PLUS = '+',

  // Delimiters
  COMMA = ',',
  SEMICOLON = ';',

  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',

  // Keywords
  FUNCTION = 'FUNCTION',
  LET = 'LET'
}

export const keywords: { [x: string]: TOKENS } = {
  fn: TOKENS.FUNCTION,
  let: TOKENS.LET
}

export function lookupIdent(ident: string) {
  return keywords[ident] || TOKENS.IDENT
}
