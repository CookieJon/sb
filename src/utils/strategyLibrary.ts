// strategyLibrary.ts

import { createCell, createStrategy,  type Cell, type Coord, type Grid, type MustHitGroup, type Region2, type Strategy, type StrategyGrid, type StrategyResult } from "../factories/index.ts";
import { GridUtils } from "./gridUtils.ts";


const STAR_HINT = 2;
const ELIM_HINT = 1;

// ---------- Shape Matrix Types ----------
export type ShapeMatrixCell = 0 | 1 | null;

export interface ShapeMatrix {
  starCount: number;            // How many stars this shape needs in order to match
  matrix: ShapeMatrixCell[][];        // original shape
  resultMatrix: ShapeMatrixCell[][];  // working copy
  width: number;
  height: number;
  id: string;
  rotations: ShapeMatrixCell[][][];       // cached rotated matrices
  resultRotations: ShapeMatrixCell[][][]; // cached rotated result matrices
}

// ---------- Matrix Utilities ----------
export function rotateMatrix(matrix: ShapeMatrixCell[][]): ShapeMatrixCell[][] {
  const height = matrix.length;
  const width = matrix[0].length;
  const rotated: ShapeMatrixCell[][] = Array.from({ length: width }, () => Array(height).fill(null));
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      rotated[c][height - 1 - r] = matrix[r][c];
    }
  }
  return rotated;
}

export function flipMatrixH(matrix: ShapeMatrixCell[][]): ShapeMatrixCell[][] {
  return matrix.map(row => [...row].reverse());
}

export function flipMatrixV(matrix: ShapeMatrixCell[][]): ShapeMatrixCell[][] {
  return [...matrix].reverse();
}

export function matricesEqual(a: ShapeMatrixCell[][], b: ShapeMatrixCell[][]): boolean {
  if (a.length !== b.length || a[0].length !== b[0].length) return false;
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[0].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}


// MISC UTILITIES
export function countStarsInCells(cells: Cell[]): number {
  return cells.reduce((count, cell) => cell.value === -1 ? count + 1 : count, 0);
}


/**
 * Attempt to match a region against all rotations of a shape.
 * Returns a StrategyResult on the first matching rotation,
 * or null if no rotation matches.
 */
export function regionMatchesShape(
  region: Region2,
  shape: ShapeMatrix
): StrategyResult | null {
  if (!shape.rotations || !shape.resultRotations) return null;

  for (let i = 0; i < shape.rotations.length; i++) {
    const rotation = shape.rotations[i];
    const resultRotation = shape.resultRotations[i];

    if (!regionMatchesRotation(region, rotation)) continue;

    // --- Build resultCells from the matched resultRotation ---
    const rows = region.cells.map(c => c.coord[0]);
    const cols = region.cells.map(c => c.coord[1]);
    const minR = Math.min(...rows);
    const minC = Math.min(...cols);

    const resultCells: Cell[] = [];

    for (let r = 0; r < resultRotation.length; r++) {
      for (let c = 0; c < resultRotation[0].length; c++) {
        const v: ShapeMatrixCell = resultRotation[r][c];
        if (v === null) continue;

        // star = -1 when v === 1, elimination = 1 when v === 0
        const value = v === 1 ? -1 : 1;

        // **Offset coordinates by -1 row and -1 column**
        const cell: Cell = {
          ...createCell([minR + r - 1, minC + c - 1] as Coord),
          value
        };
        resultCells.push(cell);
      }
    }

    return {
      applied: true,
      mustHitGroups: [],
      difficulty: 2,
      explanation: `Region ${region.id} matches shape ${shape.id}`,
      resultCells,
      hintCells: []
    };
  }

  return null; // no rotation matched
}


/**
 * Returns true if the region’s cells match the shapeMatrix exactly
 * after normalising the region to its top-left bounding box.
 */
export function regionMatchesRotation(region: Region2, rotation: ShapeMatrixCell[][]): boolean {
  // Determine bounding box of region
  const rows = region.cells.map(c => c.coord[0]);
  const cols = region.cells.map(c => c.coord[1]);
  const minR = Math.min(...rows);
  const maxR = Math.max(...rows);
  const minC = Math.min(...cols);
  const maxC = Math.max(...cols);

  const height = maxR - minR + 1;
  const width  = maxC - minC + 1;

  if (height !== rotation.length || width !== rotation[0].length) return false;

  // Build a quick lookup for region cells
  const set = new Set(region.cells.map(c => `${c.coord[0]}-${c.coord[1]}`));

  // Compare each cell in the bounding box to the rotation
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const hasCell = set.has(`${minR + r}-${minC + c}`);
      const shapeVal = rotation[r][c] === 1;
      // rotation[r][c] === null means “don’t care”
      if (rotation[r][c] !== null && shapeVal !== hasCell) {
        return false;
      }
    }
  }
  return true;
}




// -----------------------------------------------



/**
 * Apply a StrategyResult's resultCells to a StrategyGrid in-place.
 * Cells outside the grid are skipped safely.
 */
export function applyResultCellsToGrid(
  grid: Grid | StrategyGrid,
  result: StrategyResult
): void {
  const size = grid.size;

  if (!result?.resultCells) return

  for (const rc of result.resultCells) {
    const [r, c] = rc.coord;

    // Skip if cell is outside the grid
    if (r < 0 || r >= size || c < 0 || c >= size) continue;

    // Update the existing cell in the grid with the new value
    const target = grid.cells[r][c];
    target.value = rc.value;

    // Optionally also mark validity if needed
    // target.isValid = rc.isValid ?? target.isValid;
  }
}


/**
 * Apply a StrategyResult's hintCells to a StrategyGrid in-place.
 * Cells outside the grid are skipped safely.
 */
export function applyHintCellsToGrid(
  grid: Grid,
  result: StrategyResult
): void {
  const size = grid.size;

  // Hint regions
  if (!result?.hintCells) return
  for (const rc of result.hintCells) {
    const [r, c] = rc.coord;

    // Skip if cell is outside the grid
    if (r < 0 || r >= size || c < 0 || c >= size) continue;

    // Update the existing cell in the grid with the new value
    const target = grid.cells[r][c];
    // Set hint stars and eliminations only when the grid isn't starred or eliminated...
    if (
      !(
        (target.value === -1 && (rc.hintGroup & STAR_HINT)) ||   // star + star-hint
        (target.value > 0  && (rc.hintGroup & ELIM_HINT))        // eliminated + elim-hint
      )
    ) {
      target.hintGroup |= rc.hintGroup;
    }
    
  }


}




/**
 * Check whether applying a StrategyResult would change the grid.
 * No mutation is performed—returns true if any cell's value (or other
 * relevant property) would differ.
 */
export function wouldResultChangeGrid(
  grid: StrategyGrid,
  result: StrategyResult
): boolean {
  const size = grid.size;
  if (!result?.resultCells || result.resultCells.length === 0) return false;

  for (const rc of result.resultCells) {
    const [r, c] = rc.coord;

    // Skip cells outside the grid
    if (r < 0 || r >= size || c < 0 || c >= size) continue;

    const target = grid.cells[r][c];

    // Compare the value (and optionally other props like isValid)
    if (target.value !== rc.value /* || target.isValid !== rc.isValid */) {
        // console.log('Strategy would make a difference')
      return true; // a difference found
    }
  }
  // console.log('Strategy would produce no difference')
  return false; // no differences
}






// ---------- Shape Factory ----------
export function computeUniqueRotations(matrix: ShapeMatrixCell[][]): ShapeMatrixCell[][][] {
  const rotations: ShapeMatrixCell[][][] = [];
  const queue: ShapeMatrixCell[][][] = [matrix];

  for (let i = 0; i < queue.length; i++) {
    const mat = queue[i];
    const candidates = [rotateMatrix(mat), flipMatrixH(mat), flipMatrixV(mat)];

    candidates.forEach(candidate => {
      if (!rotations.some(existing => matricesEqual(existing, candidate))) {
        rotations.push(candidate);
        queue.push(candidate); // allow further rotations/flips
      }
    });
  }

  return rotations;
}

export function createShapeMatrix(
  id: string,
  starCount: number,
  matrix: ShapeMatrixCell[][],
  resultMatrix: ShapeMatrixCell[][]
): ShapeMatrix {

  // precompute rotations
  const rotations = computeUniqueRotations(matrix);
  const resultRotations = computeUniqueRotations(resultMatrix);

  const shape: ShapeMatrix = {
    matrix,
    starCount,
    resultMatrix,
    width: matrix[0].length,
    height: matrix.length,
    id,    
    rotations,
    resultRotations
  };


  console.log("SHAPE", id, shape);
  return shape;
}


// ---------- Example Shape Definitions ----------

export const SHAPE_2_I_1 = createShapeMatrix( 
    "2-I shape",
    1,
    [
    [1, 1]
    ],
    [
    [null, 0, 0, null],
    [null, null, null, null],
    [null, 0, 0, null]
    ]
);

export const SHAPE_3_I_1 = createShapeMatrix( 
    "3-I-1 shape",
    1,
    [
    [1, null, 1]
    ],
    [
    [null, null, 0, null, null],
    [null, null, null, null, null],
    [null, null, 0, null, null]
    ]
);


export const SHAPE_3_I_2 = createShapeMatrix( 
    "3-I-2 shape",
    2,
    [
    [1, null, 1]
    ],
    [
    [0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0]
    ]
);


export const SHAPE_4_I_2 = createShapeMatrix( 
    "4-I-2 shape",
    2,
    [
    [1, 1, 1, 1]
    ],
    [
    [null, 0, 0, 0, 0, null],
    [null, null, null, null, null, null],
    [null, 0, 0, 0, 0, null],
    ]
);



export const SHAPE_4_L = createShapeMatrix( 
    "4-L shape",
    2,
    [
    [1, null, 1],
    [1, null, 0]        
    ],
    [
    [null, null, 0, 0, 0],
    [0, null, 0, 1, 0],
    [0, null, 0, 0, 0],
    [null, null, null, null, null]
    ]
);

export const SHAPE_4_T = createShapeMatrix( 
    "4-T shape",
    2,
    [
    [1, null, 1],
    [0, null, 0]        
    ],
    [
    [0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
    [null, null, null, null, null]
    ]
);

export const SHAPE_4_S = createShapeMatrix( 
    "4-S shape",
    2,
    [
    [1, null, 0],
    [0, null, 1]        
    ],
    [
    [0, 0, 0, null, null],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0],
    [null, null, 0, 0, 0]
    ]
);


export const SHAPE_6_B = createShapeMatrix( 
    "4-S shape",
    2,
    [
    [1, null, 1],
    [1, null, 1]        
    ],
    [
    [null, null, null, null, null],
    [0, null, 0, null, 0],
    [0, null, 0, null, 0],
    [null, null, null, null, null]
    ]
);

export const SHAPE_9_SQUARE = createShapeMatrix( 
    "9-Square shape",
    2,
    [
    [null, null, null],
    [null, null, null],
    [null, null, null],       
    ],
    [
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, 0, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null]
    ]
);


// Central array of all shapes
export const ALL_SHAPES: ShapeMatrix[] = [SHAPE_2_I_1, SHAPE_3_I_1, SHAPE_3_I_2, SHAPE_4_I_2, SHAPE_4_L, SHAPE_4_T, SHAPE_4_S, SHAPE_6_B, SHAPE_9_SQUARE] ;

// ---------- Strategy Factory ----------
export function createHumanStrategy(
  name: string,
  difficulty: number,
  applyFn: (grid: StrategyGrid) => StrategyResult[]
): Strategy {
  return createStrategy(name, difficulty, applyFn);
}

// ---------- Example Strategy Using a Shape ----------

// 
export const strategySimpleShapes = createHumanStrategy(
  "Simple Region Shapes",
  2,
  (grid: StrategyGrid) => {

    const results: StrategyResult[] = [];

      // Cycle through all shapes
      for (const shape of ALL_SHAPES) {

        // console.log(`Testing shape Id ${shape.id}`)

        // Filter candidate regions whose remaining star count is the shape's required star count
        const regions = grid.remainingRegions.filter(region => {
          return grid.starsPer - region.starCount === shape.starCount
        })
        
        // Cycle through candidate regions for this shape
        for (const region of regions) {
          const result = regionMatchesShape(region, shape);

          // Check rule hasn't already been applied
          if (result && wouldResultChangeGrid(grid, result)) {
            result.explanation = `Region ${region.id} matches ${shape.id}`
            results.push(result)
          }

        }

      }
      return results;  
  }
);



// -------------------------------------------
// Strategy: Row/Column Forced Placements
// -------------------------------------------
export const strategyForcedPlacement = createHumanStrategy(
  "Row/Column Forced Placements",
  2,
  (grid: StrategyGrid) => {
    const results: StrategyResult[] = [];

    // ── 1️⃣ Scan every straight line (rows + columns) ──────────
    // You can extend this to regions too if desired.
    const groups: { type: string, name: string; cells: Cell[] }[] = [];
    grid.regions.sort((a, b) => a.cells.length - b.cells.length);
    grid.regions.forEach((reg) => groups.push({ type: 'region', name: `Region ${reg.id}`, cells: reg.cells }));
    grid.rows.forEach((r, i) => groups.push({ type: 'row', name: `Row ${i + 1}`, cells: r }));
    grid.columns.forEach((c, i) => groups.push({ type: 'column', name: `Col ${i + 1}`, cells: c }));

    for (const g of groups) {

      // console.log(`Testing group ${g.name}`);

      // Remaining undecided cells in this group
      const remaining = g.cells.filter(c => c.value === 0); // 0 = unknown
      
      

      if (remaining.length === 0) continue;

      // Stars still needed in this group:
      const already = g.cells.filter(c => c.value === -1).length;
      const need = grid.starsPer - already;
      if (need < 0) continue; // over-filled guard

      // Skip if no more stars required → all remaining are forced empty.
      if (need === 0) {
        results.push({
          applied: true,
          difficulty: 1,    // 1 = Easy
          explanation: `All stars in this ${g.type} have been found. The remaining cells can be eliminated.`,
          resultCells: remaining.map(c => ({ ...c, value: 1 })),
          hintCells: [
            ...remaining.map(c=> ({...c, hintGroup: 1})),
            ...g.cells.map(c=> ({...c, hintGroup: 4}))
          ],
          mustHitGroups: []
        });
        continue;
      }

      // ── 2️⃣ Compute all legal placements of 'need' stars ──────
      //    Respect adjacency + existing global stars + optional must-hits
      const placements = generateLegalPlacementsWithContext(
        remaining,
        need,
        grid
      );
    //  console.log("placements", placements)
      if (placements.length === 0) continue; // no valid placement → contradiction handled elsewhere

      // ── 3️⃣ Forced stars / empties ───────────────────────────
      const forcedStars = remaining.filter(cell =>
        placements.every(p => p.some(coord => sameCoord(coord, cell.coord)))
      );
      const forcedEmpty = remaining.filter(cell =>
        placements.every(p => !p.some(coord => sameCoord(coord, cell.coord)))
      );

     // console.log("forced Empty", forcedEmpty)

      // 🔄  Add all neighbours of each forced star as forced empty
      for (const star of forcedStars) {

        const surroundingCells = GridUtils.pickSurroundingCells(grid, star);

        for (const n of surroundingCells) {
          // skip if it's already a forced star - should never happen!
          if (forcedStars.some(s => sameCoord(s.coord, n.coord))) continue;
          // avoid duplicates
          if (!forcedEmpty.some(e => sameCoord(e.coord, n.coord))) {
            forcedEmpty.push({ ...n, value: 1 });
          }
        }
      }


      // ── 4️⃣ Find small must-hit groups (≤3 cells) ─────────────
      const mustHits = findMustHitGroups(placements, remaining, 3);

      // -- Find all eliminated outside shape based on small must-hit groups neighbours.
      const externalElims = expandMustHitNeighbours(mustHits, grid);
    


      const result = {
          applied: true,
          difficulty: 2,
          // explanation: `${g.name}: forced stars/empties or must-hit groups`,
          explanation: `Any arrangement of stars in this ${g.type} will result in these${(forcedEmpty.length > 0 || externalElims.length > 0) ? ' eliminations' : ''}${forcedStars.length > 0  && (forcedEmpty.length > 0 || externalElims.length > 0) ? ' and' : ''}${forcedStars.length > 0 ? ' star placements' : ''}.`,

          resultCells: [
            ...forcedStars.map(c => ({ ...c, value: -1 })),
            ...forcedEmpty.map(c => ({ ...c, value: 1 })),
            ...externalElims
          ],
          hintCells: [
         //   ...remaining.map(c=> ({...c, hintGroup: 4})), // remaining in group = empty = hint-group (4, 8, 16...)
            ...g.cells.map(c=> ({...c, hintGroup: 4})), // all group.cells = empty = hint-group (4, 8, 16...)
            ...forcedStars.map(c=> ({...c, hintGroup: 2})), // star = 2
            ...forcedEmpty.map(c=> ({...c, hintGroup: 1})),   // eliminated = 1
            ...externalElims.map(c=> ({...c, hintGroup: 1})),   // eliminated = 1
          ],
          mustHitGroups: mustHits
      };
      
      if (result && wouldResultChangeGrid(grid, result)) {
          //console.log(result)
          results.push(result)
      }
    }

    return results;
  }
);

/* ------------------------------------------------------------------
 * Helper: generateLegalPlacementsWithContext
 * ------------------------------------------------------------------
 * Returns all non-adjacent sets of size k chosen from the given cells,
 * also verifying:
 *   1. no placement adjacent (orthogonally or diagonally) to an
 *      already-placed star in the entire grid
 *   2. respects global row/col/region star counts already met
 *   3. (optional) future: respect known must-hit groups if supplied
 */
function generateLegalPlacementsWithContext(
  candidates: Cell[],
  k: number,
  grid: StrategyGrid
): Coord[][] {
  const coords = candidates.map(c => c.coord);
  const stars = grid.stars.map(s => s.coord);

  const results: Coord[][] = [];
  const combo: Coord[] = [];

  function backtrack(start: number) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < coords.length; i++) {
      const c = coords[i];
      if (
        combo.some(cc => isAdjacent(cc, c)) ||              // no two in combo adjacent
        stars.some(sc => isAdjacent(sc, c))                 // none next to global stars
      ) continue;
      combo.push(c);
      backtrack(i + 1);
      combo.pop();
    }
  }
  backtrack(0);
  return results;
}

/* ------------------------------------------------------------------
 * Helper: sameCoord
 * ------------------------------------------------------------------ */
function sameCoord(a: Coord, b: Coord): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

/* ------------------------------------------------------------------
 * Helper: isAdjacent
 * ------------------------------------------------------------------
 * True if cells share an edge or corner.
 */
function isAdjacent(a: Coord, b: Coord): boolean {
  return Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1;
}

/* ------------------------------------------------------------------
 * Helper: findMustHitGroups
 * ------------------------------------------------------------------
 * Examine all valid placements and discover groups of size ≤ maxSize
 * where each group is guaranteed to contain at least one star
 * (minStars = 1, maxStars = group.length).
 */
function findMustHitGroups(
  placements: Coord[][],
  allCells: Cell[],
  maxSize: number
): MustHitGroup[] {
  const mustHits: MustHitGroup[] = [];
  const coords = allCells.map(c => c.coord);

  // Generate all subsets up to maxSize
  function* subsets(arr: Coord[], size: number, start = 0, combo: Coord[] = []): Generator<Coord[]> {
    if (combo.length === size) { yield [...combo]; return; }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      yield* subsets(arr, size, i + 1, combo);
      combo.pop();
    }
  }

  for (let s = 2; s <= maxSize; s++) {
    for (const sub of subsets(coords, s)) {
      // Check if every placement intersects this subset
      if (placements.every(p => p.some(c => sub.some(x => sameCoord(x, c))))) {
        mustHits.push({
          cells: allCells.filter(c => sub.some(x => sameCoord(x, c.coord))),
          minStars: 1,
          maxStars: null
        });
      }
    }
  }
  return mustHits;
}



/**
 * Given must-hit groups, mark only those neighbours that are forced empty
 * because they are adjacent to every possible star in the group.
 * Uses GridUtils.pickSurroundingCells to find legal neighbours.
 */
function expandMustHitNeighbours(
  mustHitGroups: MustHitGroup[],
  grid: StrategyGrid
): Cell[] {
  const result: Cell[] = [];

  for (const group of mustHitGroups) {
    // Only consider cells outside the group
    const outsideCandidates = new Set<Cell>();

    for (const cell of group.cells) {
      const surroundingCells = GridUtils.pickSurroundingCells(grid, cell);
      for (const n of surroundingCells) {
        // Skip cells inside the group itself
        if (group.cells.some(c => sameCoord(c.coord, n.coord))) continue;
        outsideCandidates.add(n);
      }
    }

    // For each outside candidate, check if it is adjacent to all cells in the group
    for (const candidate of outsideCandidates) {
      const adjacentToAll = group.cells.every(c => {
        const neighbours = GridUtils.pickSurroundingCells(grid, c);
        return neighbours.some(n => sameCoord(n.coord, candidate.coord));
      });

      if (adjacentToAll && !result.some(c => sameCoord(c.coord, candidate.coord))) {
        result.push({ ...candidate, value: 1 });
      }
    }
  }

  return result;
}









// ---------------------------------------------------------------------------------
/**
 * Strategy: Containment Elimination
 *    - If a set of rows/cols is completely covered by the free cells of the same
 *      number of regions, or vice versa, cells outside the contained set can be eliminated.
 */
export const strategyContainmentElimination = createHumanStrategy(
  "Containment Elimination",
  3,
  (grid: StrategyGrid) => {
    const results: StrategyResult[] = [];

    const unknown = (cells: Cell[]) => cells.filter(c => c.value === 0);
    const stars   = (cells: Cell[]) => cells.filter(c => c.value === -1).length;

    /**
     * Core checker
     * @param containers  – candidate container groups (Regions OR Rows/Cols)
     * @param inners      – candidate inner groups (Rows/Cols OR Regions)
     * @param label       – label for console logging
     */
    function scanContainment(
      containers: { name: string; cells: Cell[] }[],
      inners: { name: string; cells: Cell[] }[],
      label: string,
      AConsecutive: boolean,
      BConsecutive: boolean
    ) {
      for (let k = 1; k <= containers.length; k++) {
        const Asets = combinations(containers, k, AConsecutive);

        for (const A of Asets) {
          const aCells = A.flatMap(g => g.cells);
          const aStars = stars(aCells);
          const aNeed  = k * grid.starsPer - aStars;
          if (aNeed <= 0) continue;

          // Debug log every outer combo
          // console.log(`[${label}] Checking A size ${k}: ${A.map(g=>g.name).join(", ")}`);

          // candidate inner sets of size k drawn from 'inners'
          const Bsets = combinations(inners, k, BConsecutive);
          for (const B of Bsets) {
            // B’s unknown cells must all lie inside A’s cells
            const bCells = B.flatMap(g => g.cells);
            const bStars = stars(bCells);
            const bNeed  = k * grid.starsPer - bStars;
            const bUnknown = unknown(bCells);

            if (bUnknown.every(c => aCells.some(a => sameCoord(a.coord, c.coord)))) {
             // console.log(                `  Candidate B inside A: ${B.map(g=>g.name).join(", ")} (need ${bNeed} vs A need ${aNeed})`              );

              if (bNeed >= aNeed) {
                // Eliminate cells in A but not in B
                const eliminate = unknown(aCells)
                  .filter(c => !bCells.some(b => sameCoord(b.coord, c.coord)));

                if (eliminate.length) {

                  // const explanation2 = `${label}\n ${A.map(g=>g.name).join(", ")} must place all stars within ${B.map(g=>g.name).join(", ")}`
              
                  
                  
                  let explanation = '';

                  switch (label) {
                    case 'RegionsToRows':
                        explanation = 'All remaining stars in these regions are contstrained to the highlighted rows.'
                        break;
                    case 'RegionsToCols':
                        explanation = 'All remaining stars in these regions are contstrained to the highlighted columns.'
                        break;
                    case 'RowsToRegions':
                        explanation = 'All remaining stars in these rows are contstrained to the highlighted regions.'
                        break;
                    case 'ColsToRegions':
                        explanation = 'All remaining stars in these columns are contstrained to the highlighted regions.'
                        break;                                                                        
                    default:
                        explanation ='test'
                  }

                  results.push({
                    applied: true,
                    difficulty: 50 + A.length,
                    explanation: explanation,                      
                    resultCells: eliminate.map(c => ({ ...c, value: 1 })),
                    hintCells: [
                  //   ...remaining.map(c=> ({...c, hintGroup: 4})), // remaining in group = empty = hint-group (4, 8, 16...)
                      ...bCells.map(c=> ({...c, hintGroup: 4})), // all group.cells = empty = hint-group (4, 8, 16...)
                      ...eliminate.map(c=> ({...c, hintGroup: 1})),   // eliminated = 1
                    ],
                    mustHitGroups: []
                  });
                 //  console.log(explanation);
                }
              }
            }
          }
        }
      }
    }

    // Prepare the basic group lists
    const rows = grid.rows.map((cells,i)=>({ name:`Row ${i+1}`, cells }));
    const cols = grid.columns.map((cells,i)=>({ name:`Col ${i+1}`, cells }));
    const regs = grid.regions.map(r=>({ name:`Region ${r.id}`, cells: r.cells }));

    // Explicit containment checks

    // 3️⃣ Regions containing Rows
    scanContainment(regs, rows, "RegionsToRows", false, true);

    // 4️⃣ Regions containing Columns
    scanContainment(regs, cols, "RegionsToCols", false, true);

    // 1️⃣ Rows containing Regions
    scanContainment(rows, regs, "RowsToRegions", true, false);

    // 2️⃣ Columns containing Regions
    scanContainment(cols, regs, "ColsToRegions", true, false);


    return results;
  }
);




/**
 * Generate all size-k combinations of the input array.
 *
 * @param items - the source array
 * @param k     - number of elements per combination
 * @returns     - array of combinations, each combination is a new array
 *
 * Example:
 *   combinations(['a','b','c'], 2)
 *   -> [ ['a','b'], ['a','c'], ['b','c'] ]
 */
export function combinations<T>(
  items: T[],
  k: number,
  consecutive = false // new flag: if true, only return combos of consecutive items
): T[][] {
  const result: T[][] = [];

  if (k <= 0 || k > items.length) return result;

  if (!consecutive) {
    // Standard combination logic (any elements)
    function helper(start: number, combo: T[]) {
      if (combo.length === k) {
        result.push([...combo]);
        return;
      }
      for (let i = start; i < items.length; i++) {
        combo.push(items[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    }
    helper(0, []);
  } else {
    // Consecutive combinations: slide a window of size k over the array
    for (let i = 0; i <= items.length - k; i++) {
      result.push(items.slice(i, i + k));
    }
  }

  return result;
}




// Central array of all strategies
//export const ALL_STRATEGIES: Strategy[] = [strategyForcedPlacement, strategySimpleShapes];

export const ALL_STRATEGIES: Strategy[] = [strategyForcedPlacement, strategyContainmentElimination];

//  export const ALL_STRATEGIES: Strategy[] = [strategyContainmentElimination];

