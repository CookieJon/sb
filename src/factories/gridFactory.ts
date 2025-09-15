// src/factories/gridFactory.ts
import { createCell, type Cell } from "./cellFactory"
import { createRegion, type Region } from "./regionFactory"

export interface Grid {
  size: number
  cells: Cell[][]
  regions: Region[]
}


export const GridUtils = {


    createGrid(size: number): Grid {
        const cells: Cell[][] = Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, col) => createCell(row, col))
        )
        return { size, cells, regions: [] }
    },


    cloneGrid(grid: Grid): Grid {
        return {
            ...grid,
            cells: grid.cells.map(row => row.map(cell => ({ ...cell }))),
            regions: grid.regions.map(region => ({
            ...region,
            cells: [...region.cells],
            })),
        }
    },

    clearGrid(grid: Grid): Grid {
        // clone the grid first to maintain immutability
        const newGrid = GridUtils.cloneGrid(grid)

        // clear all cells
        newGrid.cells.forEach(row => 
            row.forEach(cell => {
            cell.ownerId = null
            })
        )

        // clear all regions
        newGrid.regions = []

        return newGrid
    },


    pickRandomEmptyCells(grid: Grid, count: number): Cell[] {
        const allCells = grid.cells.flat()
        const emptyCells = allCells.filter(c => !c.ownerId)
        const picked: Cell[] = []
        while (picked.length < count && emptyCells.length > 0) {
            const index = Math.floor(Math.random() * emptyCells.length)
            picked.push(emptyCells.splice(index, 1)[0])
        }
        return picked
    },
    
    
    pickAdjacentEmptyCells(grid: Grid, cell: Cell): Cell[] {
        const deltas = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // N/S/E/W
        ]

        const empty: Cell[] = []

        for (const [dr, dc] of deltas) {
            const r = cell.row + dr
            const c = cell.col + dc
            if (r >= 0 && r < grid.size && c >= 0 && c < grid.size) {
                const neighbor = grid.cells[r][c]
                if (!neighbor.ownerId) empty.push(neighbor)
            }
        }

        return empty
    },


    createRegions(grid: Grid, N: number): Grid {
        
        grid = GridUtils.clearGrid(grid)

        const seeds = GridUtils.pickRandomEmptyCells(grid, N)

        seeds.forEach((cell, idx) => {
            const region = createRegion(idx + 1, cell)
            cell.ownerId = region.id
            grid.regions.push(region)
        })

        return grid

    },


    growRegions(grid: Grid): Grid {
        grid = GridUtils.cloneGrid(grid)
        let anyGrew = false
        grid.regions.forEach(region => {
            const grew = GridUtils.growRegion(grid, region)
            if (grew) anyGrew = true
        })
        //return anyGrew // true if at least one region grew
        return grid
    },


    growRegion(grid: Grid, region: Region): boolean {
        // collect all possible empty cells adjacent to any cell in the region
        const candidates: Cell[] = []
        region.cells.forEach(cell => {
            const emptyAdj = GridUtils.pickAdjacentEmptyCells(grid, cell)
            candidates.push(...emptyAdj)
        })

        if (candidates.length === 0) return false // cannot grow

        // pick a random cell to add
        const newCell = candidates[Math.floor(Math.random() * candidates.length)]
        newCell.ownerId = region.id
        region.cells.push(newCell)

        return true
    }

}