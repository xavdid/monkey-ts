export const enum SymbolScope {
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL',
  BUILTIN = 'BUILTIN',
  FREE = 'FREE',
  FUNCTION = 'FUNCTION',
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
  numDefinitions = 0
  freeSymbols: SymbolItem[] = []

  constructor(public readonly outer?: SymbolTable) {}

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

  defineFree = (original: SymbolItem): SymbolItem => {
    this.freeSymbols.push(original)

    const cloned = new SymbolItem(
      original.name,
      SymbolScope.FREE,
      this.freeSymbols.length - 1
    )

    this.store.set(original.name, cloned)
    return cloned
  }

  defineFunctionName = (name: string): SymbolItem => {
    const sym = new SymbolItem(name, SymbolScope.FUNCTION, 0)
    this.store.set(name, sym)
    return sym
  }

  resolve = (name: string): SymbolItem | undefined => {
    const obj = this.store.get(name)
    if (!obj && this.outer) {
      const outerObj = this.outer.resolve(name)
      if (!outerObj) {
        return
      }
      if (
        outerObj.scope === SymbolScope.GLOBAL ||
        outerObj.scope === SymbolScope.BUILTIN
      ) {
        return outerObj
      }

      const free = this.defineFree(outerObj)
      return free
    }
    return obj
  }
}
