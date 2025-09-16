// src/factories/gridFactory.ts
import { createCell, type Cell } from "./cellFactory"
import { createRegion, type Region } from "./regionFactory"

export interface Grid {
  size: number
  cells: Cell[][]
  regions: Region[]
  solutionCount: -1 | 0 | 1 | 2 // -1 = uncounted, 0 = no solution, 1 = unique, 2 = multiple
}
export type Coord = [number, number];

export const GridUtils = {
    // -------------------
    // Create a new empty grid
    // -------------------
    createGrid(size: number): Grid {
        const cells: Cell[][] = Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, col) => createCell([row, col]))
        );
        return { size, cells, regions: [], solutionCount: -1 };
    },

    // -------------------
    // Deep clone a grid (immutable updates)
    // -------------------
    cloneGrid(grid: Grid): Grid {
        return {
            ...grid,
            cells: grid.cells.map(row => row.map(cell => ({ ...cell }))),
            regions: grid.regions.map(region => ({
            ...region,
            cells: [...region.coords],
            })),
        };
    },

    // -------------------
    // Clear all cell ownership and remove regions
    // -------------------
    clearGrid(grid: Grid): Grid {
        const newGrid = GridUtils.cloneGrid(grid);
        newGrid.cells.forEach(row =>
            row.forEach(cell => {
                cell.ownerId = null
                cell.value = 0
        }));
        newGrid.regions = []
        newGrid.solutionCount = -1
        return newGrid
        },

        // -------------------
        // Pick N random empty cells
        // -------------------
        pickRandomEmptyCells(grid: Grid, count: number): Cell[] {
        const allCells = grid.cells.flat();
        const emptyCells = allCells.filter(c => !c.ownerId);
        const picked: Cell[] = [];
        while (picked.length < count && emptyCells.length > 0) {
            const index = Math.floor(Math.random() * emptyCells.length);
            picked.push(emptyCells.splice(index, 1)[0]);
        }
        return picked;
    },


    // -------------------
    // Create regions and grow them until grid is full
    // -------------------
    createRegions(grid: Grid, N: number): Grid {
        //grid = GridUtils.clearGrid(grid);
        grid = GridUtils.createGrid(grid.size);

        // Seed the regions
        const seeds = GridUtils.pickRandomEmptyCells(grid, N);
        seeds.forEach((cell, idx) => {
            const region = createRegion(idx + 1, cell.coords);
            cell.ownerId = region.id;
            grid.regions.push(region);
        });

        // Assign targets (optional weighting)
        GridUtils.assignRegionTargets(
            grid.regions,
            grid.cells.flat().length,
            "weightedSmall",
            { min: 7, max: 12, sizes: [{ size: 5, count:5 }, { size: 3, count:1 }] }
        );

        
        // Safety: check for impossible assignments
        const hardTotal = grid.regions
            .filter(r => r.targetIsHard)
            .reduce((sum, r) => sum + (r.targetSize ?? 0), 0);
        const softTotal = grid.regions
            .filter(r => !r.targetIsHard)
            .reduce((sum, r) => sum + (r.targetSize ?? 0), 0);
        const gridTotal = grid.cells.flat().length;
        if (hardTotal > gridTotal) {
            // Too many hard targets, treat all as soft
            grid.regions.forEach(r => r.targetIsHard = false);
            console.warn("Hard region sizes exceed grid size. All targets set to soft.");
        }

        // Grow regions until full, with safety break and fallback
        let iterations = 0;
        const maxIterations = gridTotal * 10;
        while (grid.cells.flat().some(c => !c.ownerId)) {
            const anyGrew = GridUtils.growRegions(grid);
            iterations++;
            if (!anyGrew) {
                // If stuck, relax hard targets and try again
                const anyHard = grid.regions.some(r => r.targetIsHard);
                if (anyHard) {
                    grid.regions.forEach(r => r.targetIsHard = false);
                    // console.warn("Stuck with unassigned cells. All targets set to soft.");
                    continue;
                } else {
                    throw new Error("No regions can grow further. Stuck with unassigned cells.");
                }
            }
            if (iterations > maxIterations) {
                // If exceeded max iterations, relax hard targets and try again
                const anyHard = grid.regions.some(r => r.targetIsHard);
                if (anyHard) {
                    grid.regions.forEach(r => r.targetIsHard = false);
                    // console.warn("Exceeded max iterations. All targets set to soft.");
                    iterations = 0; // reset counter
                    continue;
                } else {
                    throw new Error("Exceeded max iterations while growing regions.");
                }
            }
        }

        // Flag the cells with their border bitmask
        GridUtils.flagCellBordersBitmask(grid);

        return grid;
    },


    // -------------------
    // Assign regions with soft targets
    // -------------------
    assignRegionTargets(
        regions: Region[],
        totalCells: number,
        mode: "equal" | "randomWeighted" | "weightedSmall",
        options?: { min?: number; max?: number; sizes?: { size: number; count: number }[] }
    ) {
        const regionCount = regions.length;
        const minSize = options?.min ?? 3;
        const maxSize = options?.max ?? Math.floor(totalCells / regionCount);

        // Assign regions with exact sizes first
        let remaining = totalCells;
        let regionIdx = 0;
        if (options?.sizes) {
            for (const { size, count } of options.sizes) {
                for (let i = 0; i < count && regionIdx < regions.length; i++, regionIdx++) {
                    regions[regionIdx].targetSize = size;
                    regions[regionIdx].targetIsHard = true; // <-- mark as hard
                    remaining -= size;
                }
            }
        }

        // Assign remaining regions as before
        for (; regionIdx < regions.length; regionIdx++) {
            if (regionIdx === regions.length - 1) {
                regions[regionIdx].targetSize = remaining;
            } else {
                const maxForThis = Math.min(maxSize, Math.max(minSize, Math.floor(remaining / 2)));
                const size = Math.floor(Math.random() * (maxForThis - minSize + 1)) + minSize;
                regions[regionIdx].targetSize = size;
                regions[regionIdx].targetIsHard = false; // <-- mark as soft
                remaining -= size;
            }
        }
    },

    // -------------------
    // Grow all regions one step
    // -------------------

    growRegions(grid: Grid): boolean {
      // grid = GridUtils.cloneGrid(grid)

        let anyGrew = false;

        // Build weighted region array
        const weightedRegions: Region[] = grid.regions.flatMap(region =>
            Array(GridUtils.regionGrowthPriority(region)).fill(region)
        );

        // Shuffle to randomize selection
        for (const region of GridUtils.shuffleArray(weightedRegions)) {
            const grew = GridUtils.growRegion(grid, region);
            if (grew) anyGrew = true
        }

        return anyGrew
    },


    // -------------------
    // Grow a single region
    // -------------------
    growRegion(grid: Grid, region: Region): boolean {
        if (region.targetIsHard && region.coords.length >= (region.targetSize ?? 0)) {
            return false; // Don't grow hard-target regions beyond their size
        }

        const candidateSet = new Set<string>();

        region.coords.forEach(coord => {
            const emptyAdj = GridUtils.pickAdjacentEmptyCells(grid, coord);
            emptyAdj.forEach(c => candidateSet.add(`${c[0]},${c[1]}`));
        });

        if (candidateSet.size === 0) return false;

        const candidates: Coord[] = Array.from(candidateSet).map(s => {
            const [r, c] = s.split(",").map(Number);
            return [r, c] as Coord;
        });

        // Target size + illegal shape weighting
        let weight = region.coords.length < (region.targetSize ?? 0) ? 2 : 1;
        if (region.coords.length === 3 && !GridUtils.isStraightLine(region.coords)) weight += 2;
        if (region.coords.length === 4 && GridUtils.is2x2Square(region.coords)) weight += 2;

        const weightedIndices: number[] = [];
        for (let w = 0; w < weight; w++)
            for (let i = 0; i < candidates.length; i++) weightedIndices.push(i);

        const pickIdx = weightedIndices[Math.floor(Math.random() * weightedIndices.length)];
        const [r, c] = candidates[pickIdx];
        const cell = grid.cells[r][c];

        cell.ownerId = region.id;
        region.coords.push([r, c]);

        return true;
    },


    // -------------------
    // Get empty neighbors of a cell
    // -------------------
    pickAdjacentEmptyCells(grid: Grid, coord: Coord): Coord[] {
        const deltas: Coord[] = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1],  // right
        ];

        const [row, col] = coord;
        const empty: Coord[] = [];

        for (const [dRow, dCol] of deltas) {
            const r = row + dRow;
            const c = col + dCol;
            if (r >= 0 && r < grid.size && c >= 0 && c < grid.size) {
            const neighbor = grid.cells[r][c];
            if (!neighbor.ownerId) empty.push([r, c]);
            }
        }
        return empty;
    },



    flagCellBordersBitmask(grid: Grid) {
        const size = grid.size;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = grid.cells[r][c];
                const owner = cell.ownerId;

                let mask = 0;
                if (r === 0 || grid.cells[r - 1][c].ownerId !== owner) mask |= 1; // top
                if (c === size - 1 || grid.cells[r][c + 1].ownerId !== owner) mask |= 2; // right
                if (r === size - 1 || grid.cells[r + 1][c].ownerId !== owner) mask |= 4; // bottom
                if (c === 0 || grid.cells[r][c - 1].ownerId !== owner) mask |= 8; // left

                cell.borders = mask;
            }
        }
    },

    isStraightLine(coords: Coord[]): boolean {
        if (coords.length <= 2) return true;
        const [r0, c0] = coords[0];
        const sameRow = coords.every(([r]) => r === r0);
        const sameCol = coords.every(([, c]) => c === c0);
        return sameRow || sameCol;
    },

    is2x2Square(coords: Coord[]): boolean {
        if (coords.length !== 4) return false;

        const rows = Array.from(new Set(coords.map(([r]) => r))).sort();
        const cols = Array.from(new Set(coords.map(([, c]) => c))).sort();

        if (rows.length !== 2 || cols.length !== 2) return false;

        const positions = new Set(coords.map(([r, c]) => `${r},${c}`))
        return (
            positions.has(`${rows[0]},${cols[0]}`) &&
            positions.has(`${rows[0]},${cols[1]}`) &&
            positions.has(`${rows[1]},${cols[0]}`) &&
            positions.has(`${rows[1]},${cols[1]}`)
        )
    },

    regionGrowthPriority(region: Region): number {
        let priority = 1

        // Under target size → +1
        if (region.targetSize && region.coords.length < region.targetSize) priority += 1

        // Illegal small shapes → +2 each
        if (region.coords.length === 3 && !GridUtils.isStraightLine(region.coords)) priority += 2
        if (region.coords.length === 4 && GridUtils.is2x2Square(region.coords)) priority += 2

        return priority;
    },


    shuffleArray<T>(array: T[]): T[] {
        const arr = array.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },


    validateRegions(grid: Grid): boolean {
        // Returns true if the grid is valid
        return grid.regions.every(region => {
            const coords = region.coords;

            // No illegal 3-cell shapes
            if (coords.length === 3 && !GridUtils.isStraightLine(coords)) return false;

            // No 2x2 squares
            if (coords.length === 4 && GridUtils.is2x2Square(coords)) return false;

            // Otherwise OK
            return true;
        });
    },



    isStarPlacementValid(grid: Grid, r: number, c: number): boolean {
        const cell = grid.cells[r][c];
        if (cell.value === 2) return false; // already a star
        if (cell.value === 1) return false; // eliminated

        const N = 2; // stars per row/col/region

        // Row check
        const rowStars = grid.cells[r].filter(c => c.value === 2).length;
        if (rowStars >= N) return false;

        // Column check
        const colStars = grid.cells.map(row => row[c].value).filter(v => v === 2).length;
        if (colStars >= N) return false;

        // Region check
        const region = grid.regions.find(rg => rg.id === cell.ownerId);
        const regionStars = region?.coords.map(([rr, cc]) => grid.cells[rr][cc].value)
            .filter(v => v === 2).length ?? 0;
        if (regionStars >= N) return false;

        // Adjacent / diagonal check
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < grid.size && nc >= 0 && nc < grid.size) {
                    if (grid.cells[nr][nc].value === 2) return false;
                }
            }
        }

        return true;
    },


/**
 * Returns:
 * 0 = no solution
 * 1 = unique solution
 * 2 = multiple solutions
 * 
 * Fills the grid with stars if unique solution,
 * or with the last attempted stars if no solution.
 */
solveStarsUniqueness(
    grid: Grid,
    starsPerRowCol = 2,
    starsPerRegion = 2
): Grid {
    const regionSizes = new Map<number, number>();
    grid.regions.forEach(r => regionSizes.set(r.id, r.coords.length));

    const coords: Coord[] = grid.cells
        .flatMap((row, r) => row.map((_, c) => [r, c] as Coord))
        .sort((a, b) =>
            (regionSizes.get(grid.cells[a[0]][a[1]].ownerId!) ?? 0) -
            (regionSizes.get(grid.cells[b[0]][b[1]].ownerId!) ?? 0)
        );

    const rowCounts = Array(grid.size).fill(0);
    const colCounts = Array(grid.size).fill(0);
    const regionCounts = new Map<number, number>();

    let solutionCount = 0;
    let lastAttemptStars: Coord[] = [];
    let uniqueStars: Coord[] = [];
    const currentStars: Coord[] = [];

    function remainingStarsPossible(idx: number): boolean {
        // Check rows
        for (let r = 0; r < grid.size; r++) {
            const need = starsPerRowCol - rowCounts[r];
            const left = coords.slice(idx).filter(([rr, cc]) => rr === r && grid.cells[rr][cc].value === 0).length;
            if (left < need) return false;
        }
        // Check columns
        for (let c = 0; c < grid.size; c++) {
            const need = starsPerRowCol - colCounts[c];
            const left = coords.slice(idx).filter(([rr, cc]) => cc === c && grid.cells[rr][cc].value === 0).length;
            if (left < need) return false;
        }
        // Check regions
        for (const region of grid.regions) {
            const need = starsPerRegion - (regionCounts.get(region.id) ?? 0);
            const left = region.coords.filter(([rr, cc]) =>
                grid.cells[rr][cc].value === 0 &&
                coords.slice(idx).some(([x, y]) => x === rr && y === cc)
            ).length;
            if (left < need) return false;
        }
        return true;
    }

    function backtrack(idx: number): void {
        if (solutionCount > 1) return;

        if (idx === coords.length) {
            solutionCount++;
            console.log(`Solution #${solutionCount} found, stars:`, currentStars);
            if (solutionCount === 1) uniqueStars = [...currentStars];
            return;
        }

        if (!remainingStarsPossible(idx)) {
            lastAttemptStars = [...currentStars];
            return;
        }

        const [r, c] = coords[idx];
        const cell = grid.cells[r][c];
        if (cell.value !== 0) {
            backtrack(idx + 1);
            return;
        }

        const regionId = cell.ownerId!;

        // Try placing a star
        if (
            rowCounts[r] < starsPerRowCol &&
            colCounts[c] < starsPerRowCol &&
            (regionCounts.get(regionId) ?? 0) < starsPerRegion &&
            GridUtils.isStarPlacementValid(grid, r, c)
        ) {
            // Place star
            cell.value = 2;
            rowCounts[r]++; colCounts[c]++;
            regionCounts.set(regionId, (regionCounts.get(regionId) ?? 0) + 1);
            currentStars.push([r, c]);

            // Mark adjacent cells as eliminated
            const eliminated: Coord[] = [];
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < grid.size && nc >= 0 && nc < grid.size) {
                        const nCell = grid.cells[nr][nc];
                        if (nCell.value === 0) {
                            nCell.value = 1;
                            eliminated.push([nr, nc]);
                        }
                    }
                }
            }

            backtrack(idx + 1);

            // Undo
            cell.value = 0;
            rowCounts[r]--; colCounts[c]--;
            regionCounts.set(regionId, (regionCounts.get(regionId) ?? 0) - 1);
            currentStars.pop();
            eliminated.forEach(([er, ec]) => grid.cells[er][ec].value = 0);
        }

        // Try skipping this cell
        backtrack(idx + 1);
    }


    backtrack(0);


    // Fill the grid with the unique solution or last attempted stars
    grid.cells.forEach(row => row.forEach(cell => cell.value = 0));
    const starsToFill = solutionCount === 1 ? uniqueStars : lastAttemptStars;
    starsToFill.forEach(([r, c]) => grid.cells[r][c].value = 2);

    grid.solutionCount = solutionCount === 0 ? 0 : solutionCount === 1 ? 1 : 2;


    return grid;
}




};
