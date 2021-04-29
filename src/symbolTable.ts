export const enum SymbolScope {
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL',
  BUILTIN = 'BUILTIN',
}

// Symbol is a soft reserved word in JS
export class SymbolItem {
  constructor(
    public readonly name: string,
    public scope: SymbolScope,
    public readonly index: number
  ) {}
}

export class SymbolTable {
  store: Map<string, SymbolItem> = new Map()
  outer?: SymbolTable
  numDefinitions = 0

  constructor(outer?: SymbolTable) {
    this.outer = outer
  }

  define = (name: string): SymbolItem => {
    const newSym = new SymbolItem(name, SymbolScope.GLOBAL, this.numDefinitions)
    if (this.outer) {
      newSym.scope = SymbolScope.LOCAL
    }
    this.store.set(name, newSym)
    // track these manually because builtins don't count
    this.numDefinitions += 1
    return newSym
  }

  defineBuiltin = (index: number, name: string): SymbolItem => {
    const sym = new SymbolItem(name, SymbolScope.BUILTIN, index)
    this.store.set(name, sym)
    return sym
  }

  resolve = (name: string): SymbolItem | undefined => {
    const obj = this.store.get(name)
    if (!obj && this.outer) {
      return this.outer.resolve(name)
    }
    return obj
  }
}
