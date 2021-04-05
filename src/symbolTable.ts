export const enum SymbolScope {
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL',
}

// Symbol is a soft reserved word
export class SymbolItem {
  constructor(
    public readonly name: string,
    public readonly scope: SymbolScope,
    public readonly index: number
  ) {}
}

export class SymbolTable {
  store: Map<string, SymbolItem> = new Map()
  outer?: SymbolTable

  constructor(outer?: SymbolTable) {
    this.outer = outer
  }

  get numDefinitions(): number {
    return this.store.size
  }

  define = (name: string): SymbolItem => {
    const newSym = new SymbolItem(name, SymbolScope.GLOBAL, this.numDefinitions)
    this.store.set(name, newSym)
    return newSym
  }

  resolve = (name: string): SymbolItem | undefined => {
    return this.store.get(name)
  }
}
