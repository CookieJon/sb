// src/factories/cellFactory.ts

import type { Coord } from "./gridFactory"

export interface Cell {
  coords: Coord
  ownerId: number | null
  value: number    // 0 | 1 | 2  // 0=undecided, 1=eliminated, 2=sta
  borders?: number; // bitmask: top=1, right=2, bottom=4, left=8
}

export function createCell(coords: Coord): Cell {
  return { coords, ownerId: null, value: 0}
}
