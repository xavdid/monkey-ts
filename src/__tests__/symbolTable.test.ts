import { SymbolItem, SymbolTable, SymbolScope } from '../symbolTable'

describe('Symbol Table', () => {
  it('should define values', () => {
    const expectedDefinitions: { [name: string]: SymbolItem } = {
      a: new SymbolItem('a', SymbolScope.GLOBAL, 0),
      b: new SymbolItem('b', SymbolScope.GLOBAL, 1),
      c: new SymbolItem('c', SymbolScope.LOCAL, 0),
      d: new SymbolItem('d', SymbolScope.LOCAL, 1),
      e: new SymbolItem('e', SymbolScope.LOCAL, 0),
      f: new SymbolItem('f', SymbolScope.LOCAL, 1),
    }

    const global = new SymbolTable()
    expect(global.define('a')).toEqual(expectedDefinitions.a)
    expect(global.define('b')).toEqual(expectedDefinitions.b)

    const local = new SymbolTable(global)
    expect(local.define('c')).toEqual(expectedDefinitions.c)
    expect(local.define('d')).toEqual(expectedDefinitions.d)

    const secondLocal = new SymbolTable(local)
    expect(secondLocal.define('e')).toEqual(expectedDefinitions.e)
    expect(secondLocal.define('f')).toEqual(expectedDefinitions.f)
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

  it('should resolve nested local values', () => {
    const global = new SymbolTable()
    global.define('a')
    global.define('b')

    const local = new SymbolTable(global)
    local.define('c')
    local.define('d')

    const secondLocal = new SymbolTable(local)
    secondLocal.define('e')
    secondLocal.define('f')

    const tests: Array<{
      table: SymbolTable
      expectedSymbols: SymbolItem[]
    }> = [
      {
        table: local,
        expectedSymbols: [
          new SymbolItem('a', SymbolScope.GLOBAL, 0),
          new SymbolItem('b', SymbolScope.GLOBAL, 1),
          new SymbolItem('c', SymbolScope.LOCAL, 0),
          new SymbolItem('d', SymbolScope.LOCAL, 1),
        ],
      },
      {
        table: secondLocal,
        expectedSymbols: [
          new SymbolItem('a', SymbolScope.GLOBAL, 0),
          new SymbolItem('b', SymbolScope.GLOBAL, 1),
          new SymbolItem('e', SymbolScope.LOCAL, 0),
          new SymbolItem('f', SymbolScope.LOCAL, 1),
        ],
      },
    ]
    tests.forEach(({ table, expectedSymbols }) => {
      expectedSymbols.forEach((sym) =>
        expect(table.resolve(sym.name)).toEqual(sym)
      )
    })
  })

  it('should resolve builtins', () => {
    const global = new SymbolTable()
    const firstLocal = new SymbolTable(global)
    const secondLocal = new SymbolTable(firstLocal)

    const expected = [
      new SymbolItem('a', SymbolScope.BUILTIN, 0),
      new SymbolItem('c', SymbolScope.BUILTIN, 1),
      new SymbolItem('e', SymbolScope.BUILTIN, 2),
      new SymbolItem('f', SymbolScope.BUILTIN, 3),
    ]

    expected.forEach((sym, i) => global.defineBuiltin(i, sym.name))
    ;[global, firstLocal, secondLocal].forEach((table) => {
      expected.forEach((sym) => {
        expect(table.resolve(sym.name)).toEqual(sym)
      })
    })
  })
})
