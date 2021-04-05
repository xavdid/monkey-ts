import { SymbolItem, SymbolTable, SymbolScope } from '../symbolTable'

describe('Symbol Table', () => {
  it('should define values', () => {
    const global = new SymbolTable()
    expect(global.define('a')).toEqual(
      new SymbolItem('a', SymbolScope.GLOBAL, 0)
    )
    expect(global.define('b')).toEqual(
      new SymbolItem('b', SymbolScope.GLOBAL, 1)
    )
  })
  it('should resolve global values', () => {
    const global = new SymbolTable()
    global.define('a')
    global.define('b')

    const symbols = [
      new SymbolItem('a', SymbolScope.GLOBAL, 0),
      new SymbolItem('b', SymbolScope.GLOBAL, 1),
    ]

    symbols.forEach((sym) => {
      const result = global.resolve(sym.name)
      expect(result).toEqual(sym)
    })
  })
  it('should resolve local values', () => {
    const global = new SymbolTable()
    global.define('a')
    global.define('b')

    const local = new SymbolTable(global)
    local.define('c')
    local.define('d')

    const expected: SymbolItem[] = [
      new SymbolItem('a', SymbolScope.GLOBAL, 0),
      new SymbolItem('b', SymbolScope.GLOBAL, 1),
      new SymbolItem('c', SymbolScope.LOCAL, 0),
      new SymbolItem('d', SymbolScope.LOCAL, 1),
    ]
    expected.forEach((sym) => expect(local.resolve(sym.name)).toEqual(sym))
  })
})
