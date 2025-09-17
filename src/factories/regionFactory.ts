// src/factories/regionFactory.ts
import type { Coord } from "./gridFactory"

export interface Region {
  id: number
  coords: Coord[]
  targetSize?: number
  targetIsHard?: boolean // <-- Add this property
}

export function createRegion(id: number, startingCoord: Coord, targetSize: number = 4): Region {
  return {
    id,
    coords: [startingCoord],
    targetSize: targetSize,
    targetIsHard: false // <-- Default to soft target
  }
}


