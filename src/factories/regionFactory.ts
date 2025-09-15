// src/factories/regionFactory.ts
import type { Cell } from "./cellFactory"

export interface Region {
  id: number
  cells: Cell[]
}

export function createRegion(id: number, startingCell: Cell): Region {
  return { id, cells: [startingCell] }
}
