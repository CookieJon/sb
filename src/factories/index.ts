// factories/index.ts
export * from "./cellFactory.ts"
export * from "./gridFactory.ts"
export * from "./regionFactory.ts"
export * from "./strategyFactory.ts"

export function clone<T>(obj: T): T {
  return structuredClone(obj);
}
