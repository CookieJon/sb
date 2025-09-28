import type { Cell, Coord, Grid, Puzzle } from ".";
import { countStarsInCells } from "../utils/strategyLibrary.ts";

export interface StrategyResult {
  applied: boolean;
  resultCells: Cell[]; // array of cells with coords & value for elimination or star
  hintCells: Cell[];   // array of cells with coords to highlight as hints

  mustHitGroups: MustHitGroup[]  // array of groups of cells in which have a min or max of stars
  highlightedCoords?: Coord[]; // for hints - deprecated
  pinpointedCoords?: Coord[]  // for hints - deprecated
  explanation?: string;
  difficulty: number;
}


export interface MustHitGroup {
  cells: Cell[]; // array of cells in the group
  minStars: number | null;
  maxStars: number | null;
}

export function createMustHitGroup(): MustHitGroup {
  return {
    cells: [],
    minStars:null,
    maxStars:null
  }
}

export interface Strategy {
  name: string;
  difficulty: number;         // base rating
  apply(grid: StrategyGrid): StrategyResult[];
}

export function createStrategy(
  name: string,
  difficulty: number,
  apply: (grid: StrategyGrid) => StrategyResult[]
): Strategy {
  return {
    name,
    difficulty,
    apply,
  };
}


// Specialised grid object for strategy solver - uses cell references instead of coords

// Region2
export interface Region2 {
  id: number
  starCount: number
  cells: Cell[]
}

export function createRegion2(id: number): Region2 {
  return {
    id,
    starCount: 0,
    cells: []
  }
}

// StrategyGrid
export interface StrategyGrid {
  size: number;
  starsPer: number;
  cells: Cell[][];          // direct access
  rows: Cell[][];
  columns: Cell[][];
  regions: Region2[];           
  remainingRegions: Region2[];  // Only the active cells in each region
  stars: Cell[];
  // any other derived data you want to cache
}



export function createStrategyGrid(grid: Grid, puzzle: Puzzle): StrategyGrid {

  // INITISALISE STRATEGY GRID WITH USEFUL DATA STRUCTURES

  const size = grid.size;
  const starsPer = puzzle.starsPer;

  const cells = structuredClone(grid.cells);

  const rows = cells; // already row-oriented
  const columns: Cell[][] = Array.from({ length: size }, (_, c) => cells.map(row => row[c]));

  // region2s
  const map = new Map<number, Cell[]>();  
  for (const cell of cells.flat()) {
    if (cell.ownerId == null) continue; // skip unassigned cells
    if (!map.has(cell.ownerId)) {
      map.set(cell.ownerId, []);
    }
    map.get(cell.ownerId)!.push(cell);
  }
  const regions =  Array.from(map.entries()).map(([id, regionCells]) => ({
    id,
    cells: regionCells,
    starCount: countStarsInCells(regionCells)
  }));

  // Build filtered/“decayed” regions: only undecided cells
  const remainingRegions = regions.map(r => ({
    id: r.id,
    starCount: r.starCount,
    cells: r.cells.filter(c => c.value === 0) // 0 = undecided in your Cell type
  }));

  const stars = puzzle.stars.map(([r, c]) => cells[r][c]); // Get array of cells from list of coords


 // console.table(regions);
//
  return {
    size,
    starsPer,
    cells,
    rows,
    columns,
    regions,
    remainingRegions,
    stars
  }

}



