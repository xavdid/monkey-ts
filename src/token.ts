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
  MINUS = '-',
  BANG = '!',
  ASTERISK = '*',
  SLASH = '/',

  LT = '<',
  GT = '>',
  EQ = '==',
  NOT_EQ = '!=',

  // Delimiters
  COMMA = ',',
  SEMICOLON = ';',

  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',

  // Keywords
  FUNCTION = 'FUNCTION',
  LET = 'LET',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  IF = 'IF',
  ELSE = 'ELSE',
  RETURN = 'RETURN'
}

export const keywords: { [x: string]: TOKENS } = {
  fn: TOKENS.FUNCTION,
  let: TOKENS.LET,
  true: TOKENS.TRUE,
  false: TOKENS.FALSE,
  if: TOKENS.IF,
  else: TOKENS.ELSE,
  return: TOKENS.RETURN
}

export function lookupIdent(ident: string) {
  return keywords[ident] || TOKENS.IDENT
}
