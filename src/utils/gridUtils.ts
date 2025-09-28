
import type { Coord, Cell, Grid, Region, Puzzle, StrategyGrid } from "../factories/index.ts";
import {createGrid, createRegion} from "../factories/index.ts"; // for functions




export const GridUtils = {


    // -------------------
    // Create game from puzzle
    // -------------------
    // createGame(puzzle: Puzzle): Game {
    //     // Attach the puzzle and a new grid prepared for this puzzle 

    //     const grid = GridUtils.createPuzzleGrid(puzzle);

    //     return {    
    //         puzzle,
    //         grid,
    //         history: [],
    //         lastCheckValid: null,
    //         errorCount: 0
    //     };
    // },

    // -------------------
    // Create an empty grid
    // -------------------
    // createGrid(size: number): Grid {
    //     const cells: Cell[][] = Array.from({ length: size }, (_, row) =>
    //         Array.from({ length: size }, (_, col) => createCell([row, col]))
    //     );
    //     return { size, cells };
    // },

    // -------------------
    // Deep clone a grid (immutable updates)
    // -------------------
    cloneGrid(grid: Grid): Grid {
        return {
            ...grid,
            cells: grid.cells.map(row => row.map(cell => ({ ...cell })))
        };
    },

    // Create a new grid, and initialise it with a puzzle's regions & cell borders
    createPuzzleGrid(puzzle: Puzzle): Grid {

        const grid = createGrid(puzzle.size);

        // assign regions to cells
        puzzle.regions.forEach(region => {
            region.coords.forEach(([r, c]) => {
                grid.cells[r][c].ownerId = region.id;
            });
        });
        
        // assign border information to cells
        GridUtils.flagCellBordersBitmask(grid);

        return grid

    },

    applySolution(puzzle: Puzzle, grid: Grid): void {

        // Clear all stars from game grid, then place puzzle solution's stars in game grid.
        grid.cells.flatMap(row => row).forEach(cell => {
            if (cell.value === -1) cell.value = 0;
        });

        // Set the solution's stars on the grid
        puzzle.stars.forEach(([r, c]) => {
            if (grid.cells[r] && grid.cells[r][c]) {
                grid.cells[r][c].value = -1;
            }
        });

        GridUtils.clearValidation(grid);

    },

    applyValidation(puzzle: Puzzle, grid: Grid): void {
        
        const starSet = new Set(puzzle.stars.map(([r, c]) => `${r},${c}`));
        let errorCount = 0;

        grid.cells.flat().forEach(cell => { 

            const key = `${cell.coord[0]},${cell.coord[1]}`;

            if (cell.value === -1) {
                if (starSet.has(key)) {
                    cell.isValid = true;
                } else {
                    cell.isValid = false;
                    errorCount++;
                }
            } else if (cell.value > 0) {
                if (starSet.has(key)) {
                    cell.isValid = false;
                    errorCount++;
                } else {
                    cell.isValid = true;
                }
            } else {
                // value === 0
                cell.isValid = null;
            }

        });

        grid.errorCount = errorCount
        grid.lastCheckValid = errorCount == 0 /// true | false
        
    },

    clearValidation(grid: Grid): void {
        // TODO: Change name - this now clears hints, messages, whatever

        grid.errorCount = 0;
        grid.lastCheckValid = null;
        grid.cells.flat().forEach(cell => {
            cell.isValid = null;
            cell.hintGroup = 0;
        })


    },


    clearCells(grid: Grid): Grid {
        const newGrid = GridUtils.cloneGrid(grid);
        newGrid.cells.forEach(row =>
            row.forEach(cell => {
                cell.value = 0
        }));
        return newGrid
    },

    logGrid(grid: Grid | StrategyGrid) {
        const size = grid.size;

        for (let r = 0; r < size; r++) {
            let rowStr = '';
            for (let c = 0; c < size; c++) {
            const cell = grid.cells[r][c];

            if (cell.value === -1) {
                rowStr += '*';            // star
            } else if (cell.value > 0) {
                rowStr += 'X';            // elimination
            } else {
                rowStr += '.';            // empty
            }

            rowStr += ' ';               // optional spacing
            }
            console.log(r + ':' + rowStr);
        }
        console.log('──────────────────────────');
    },


    updateCell(grid: Grid, cell: Cell): Grid {

      const next = GridUtils.cloneGrid(grid);
      const { coord: [row, col], value } = cell;

      const newValue = value === 0 ? 1 : value > 0 ? -1 : 0;
      next.cells[row][col].value = newValue;

      // update surrounding
      const surroundingOffsets = [ [-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1] ];
      surroundingOffsets.forEach(([dr,dc]) => {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < next.size && c >= 0 && c < next.size) {
          if (newValue === -1 && next.cells[r][c].value >= 0) next.cells[r][c].value++;                 // Add star - Increase surrounding elimination weight
          if (value === -1 && newValue === 0 && next.cells[r][c].value > 0) next.cells[r][c].value--;   // Remove star - Decrease elimination weight
        }
      });

      GridUtils.clearValidation(next);

      return next;
    },
        
    isSolved(grid: Grid | StrategyGrid, puzzle: Puzzle): boolean {
        const size = grid.size;
       
        // 1️⃣ Build a Set of stringified puzzle star coordinates for quick lookup
        const starSet = new Set(puzzle.stars.map(([r, c]) => `${r},${c}`));

        // 2️⃣ Loop over the grid
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
            const isStarInGrid = grid.cells[r][c].value === -1;
            const shouldBeStar = starSet.has(`${r},${c}`);

            // If the grid has a star where it shouldn't, or missing one, fail
            if (isStarInGrid !== shouldBeStar) {
                return false;
            }
            }
        }

        // All stars match exactly
        return true;
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


    pickSurroundingCells(grid: Grid | StrategyGrid, cell: Cell): Cell[] {
     
        const surroundingOffsets = [[-1, -1], [-1, 0], [-1, 1], [ 0, -1],  [ 0, 1], [ 1, -1], [ 1, 0], [ 1, 1]];
        const surroundingCells : Cell[] = []

        for (const [dr, dc] of surroundingOffsets) {
            const nr = cell.coord[0] + dr;
            const nc = cell.coord[1] + dc;

            // Skip if outside grid bounds
            if (nr < 0 || nr >= grid.size || nc < 0 || nc >= grid.size) continue;

            const neighbour = grid.cells[nr][nc];
            if (!neighbour) continue;

            surroundingCells.push( grid.cells[nr][nc])
        }

        return surroundingCells;

    },


    // -------------------
    // Create an array of regions (for a Puzzle)
    // -------------------
    createRegions(size: number): Region[] {

        // size is grid size (e.g., 9) and determines number of regions
        
        let grid = createGrid(size); // temporary grid for region growth
        let regions: Region[] = [];

        // Seed the regions on the temporary grid   
        const seeds = GridUtils.pickRandomEmptyCells(grid, size);
        seeds.forEach((cell, idx) => {
            const region = createRegion(idx + 1, cell.coord);
            cell.ownerId = region.id;
            regions.push(region);
        });

        // Assign targets (optional weighting)
        GridUtils.assignRegionTargets(
            regions,
            grid.cells.flat().length,
           //{ min:9, max: 10, sizes: [ {size: 4, count: 2}, {size: 5, count: 1}, {size: 6, count: 1}]}
             { min:3, max: 10, sizes: [ {size: 5, count: 3}]}
        );

        
        // Safety: check for impossible assignments
        const hardTotal = regions
            .filter(r => r.targetIsHard)
            .reduce((sum, r) => sum + (r.targetSize ?? 0), 0);

        const gridTotal = grid.cells.flat().length;
        if (hardTotal > gridTotal) {
            // Too many hard targets, treat all as soft
            regions.forEach(r => r.targetIsHard = false);
            console.warn("Hard region sizes exceed grid size. All targets set to soft.");
        }

        // Grow regions until full, with safety break and fallback
        let iterations = 0;
        const maxIterations = gridTotal * 10;
        while (grid.cells.flat().some(c => !c.ownerId)) {
            const anyGrew = GridUtils.growRegions(grid, regions);  // modifies grid and regions
            iterations++;
            if (!anyGrew) {
                // If stuck, relax hard targets and try again
                const anyHard = regions.some(r => r.targetIsHard);
                if (anyHard) {
                    regions.forEach(r => r.targetIsHard = false);
                    // console.warn("Stuck with unassigned cells. All targets set to soft.");
                    continue;
                } else {
                    throw new Error("No regions can grow further. Stuck with unassigned cells.");
                }
            }
            if (iterations > maxIterations) {
                // If exceeded max iterations, relax hard targets and try again
                const anyHard = regions.some(r => r.targetIsHard);
                if (anyHard) {
                    regions.forEach(r => r.targetIsHard = false);
                    // console.warn("Exceeded max iterations. All targets set to soft.");
                    iterations = 0; // reset counter
                    continue;
                } else {
                    throw new Error("Exceeded max iterations while growing regions.");
                }
            }
        }

        // Flag the cells with their border bitmask
        // TODO: Move this to when a puzzle is assigned to a game
        // GridUtils.flagCellBordersBitmask(grid);

        return regions;
    },


    // -------------------
    // Assign regions with soft targets
    // -------------------
    assignRegionTargets(
        regions: Region[],
        totalCells: number,
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
    // - Mutates a temporary grid, and an array of regions
    // -------------------

    growRegions(grid: Grid, regions: Region[]): Boolean {

        let anyGrew = false;

        // Build weighted region array
        const weightedRegions: Region[] = regions.flatMap(region =>
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
        // assumes all cells have ownerId set
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


    validateRegions(regions: Region[]): boolean {
        // Returns true if the grid is valid
        return regions.every(region => {
            const coords = region.coords;

            // No illegal 3-cell shapes
            if (coords.length === 3 && !GridUtils.isStraightLine(coords)) return false;

            // No 2x2 squares
            if (coords.length === 4 && GridUtils.is2x2Square(coords)) return false;

            // Otherwise OK
            return true;
        });
    },



    // ---------

    getRegionsFromCells(cells: Cell[][]): Region[] {

        const map = new Map<number, [number, number][]>();

        for (const row of cells) {
            for (const cell of row) {
                if (cell.ownerId == null) continue; // skip nulls
                // is key (regionId) doesn't exist, add it to the map
                if (!map.has(cell.ownerId)) {
                    map.set(cell.ownerId, []);
                }
                // add cell to the array value at the map's key
                map.get(cell.ownerId)!.push([cell.coord[0], cell.coord[1]]);
                }
        }

        // convert map to regions
        const regions: Region[] = [];
        for (const [id, coords] of map.entries()) {
            regions.push({ id, coords: coords });
        }

        return regions;
    }

};
