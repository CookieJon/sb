// src/factories/regionFactory.ts
import type { Coord } from "./gridFactory"

export interface Region {
  id: number
  coords: Coord[],
  targetSize: number
}

export function createRegion(id: number, startingCoord: Coord, targetSize: number = 4): Region {
  return { id, coords: [startingCoord], targetSize }
}
