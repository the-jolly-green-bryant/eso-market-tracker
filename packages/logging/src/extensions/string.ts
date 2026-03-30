export {}

declare global {
  interface String {
    startsWithAny(prefixes: string[]): boolean
    endsWithAny(prefixes: string[]): boolean
    isAny(prefixes: string[] | RegExp[]): boolean
  }
}

String.prototype.startsWithAny = function (prefixes: string[]): boolean {
  return prefixes.some((p) => this.startsWith(p))
}

String.prototype.endsWithAny = function (prefixes: string[]): boolean {
  return prefixes.some((p) => this.endsWith(p))
}

String.prototype.isAny = function (prefixes: string[]): boolean {
  return prefixes.some((p) => this.replace(p, '').length == 0)
}
