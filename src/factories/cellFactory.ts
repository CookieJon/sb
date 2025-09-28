// src/factories/cellFactory.ts

import type { Coord } from "./gridFactory"

export interface Cell {
  coord: Coord
  ownerId: number | null
  value: number    // 0 | -1 | 1,2,3...  // 0=undecided, -1=star, 1... eliminated
  hintGroup: number; // bitmask: eliminated=1, star=2, group-3, etc.
  borders?: number; // bitmask: top=1, right=2, bottom=4, left=8
  isValid: boolean | null
}

export function createCell(coord: Coord): Cell {
  return { coord, ownerId: null, value: 0, hintGroup: 0, isValid: null}
}
