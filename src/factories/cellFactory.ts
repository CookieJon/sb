// src/factories/cellFactory.ts
export interface Cell {
  row: number
  col: number
  ownerId: number | null
  value: string
}

export function createCell(row: number, col: number): Cell {
  return { row, col, ownerId: null, value: 'x' }
}
