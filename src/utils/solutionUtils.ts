//
// Functions for brute-force finding solutions to random puzzles.
//

// --- Star placement validity ---

import type {Grid, Puzzle } from "../factories/index.ts";
import { createGrid, createStrategyGrid } from "../factories/index.ts";
import { GridUtils } from "./gridUtils.ts";

import { PuzzleUtils } from "./puzzleUtils.ts";
import { applyResultCellsToGrid } from "./strategyLibrary.ts";
import { runHumanSolver } from "./strategyUtils.ts";



// --- Solve a puzzle ---

// MAIN STARTING POINT 1
//
export function solvePuzzle(puzzle: Puzzle) : void {

  // Brute-force backtracking solver

  // Mutates puzzle in place to add solution information
  
  solveStarsUniqueness(puzzle);

  console.log("Solutions found:", puzzle.solutionCount);

}


// --- Unique puzzle generation ---

// MAIN STARTING POINT 2
//
export function generateUniquePuzzle(size: number, starsPer: number): Puzzle | null {

  let attempts = 0;
  let uniqueFound = false;

  while (attempts < 10000 && !uniqueFound) {
    attempts++;

    const newPuzzle = PuzzleUtils.generatePuzzle(size, starsPer)

    solveStarsUniqueness(newPuzzle);

    if (newPuzzle.solutionCount === 1) {
      console.log(`Unique solution found after ${attempts} attempt(s)!`);
      return newPuzzle;
    } 
    if (newPuzzle.solutionCount === 2) {
      //console.log(`2 solutions found after ${attempts} attempt(s). Retrying...`);
    }
  }
  
  console.log(`No unique solution found in ${attempts} attempts.`);

  return null

}


// MAIN STARTING POINT 3
// Unique puzzle solvable with strategies
//
export function generateUniqueSolvablePuzzle(
  size: number,
  starsPer: number
): Puzzle | null {
  let attempts = 0;

  while (attempts < 10) {
    attempts++;

    // 1. Try to create a unique puzzle
    const newPuzzle = generateUniquePuzzle(size, starsPer);
    if (!newPuzzle) continue; // if puzzle generation failed, try again

    
    //let tmp = JSON.parse('{"id":"c3413402-d399-46f3-8139-7fd80a8bb47f","size":9,"starsPer":2,"regions":[{"id":1,"coords":[[1,4],[0,4],[0,3],[1,3],[2,4]],"targetSize":5,"targetIsHard":true},{"id":2,"coords":[[6,6],[5,6],[5,5],[5,4],[4,5]],"targetSize":5,"targetIsHard":true},{"id":3,"coords":[[3,7],[3,6],[3,8],[3,5],[2,7]],"targetSize":5,"targetIsHard":true},{"id":4,"coords":[[8,2],[7,2],[8,1],[8,0],[7,3],[7,0],[6,0],[7,4],[8,4],[8,3]],"targetSize":6,"targetIsHard":false},{"id":5,"coords":[[0,6],[0,7],[1,6],[1,5],[2,6],[1,7],[1,8],[0,8],[2,8],[0,5],[2,5]],"targetSize":9,"targetIsHard":false},{"id":6,"coords":[[5,2],[5,1],[4,2],[5,3],[4,3],[5,0],[4,0],[4,4],[3,4]],"targetSize":3,"targetIsHard":false},{"id":7,"coords":[[4,1],[3,1],[3,2],[2,1],[2,2],[1,2],[3,0],[0,2],[2,3],[3,3],[1,1],[0,1],[1,0],[2,0],[0,0]],"targetSize":8,"targetIsHard":false},{"id":8,"coords":[[6,3],[6,2],[6,1],[7,1],[6,4],[6,5],[7,5],[8,5],[8,6]],"targetSize":9,"targetIsHard":false},{"id":9,"coords":[[7,8],[6,8],[6,7],[7,7],[5,7],[8,8],[8,7],[7,6],[5,8],[4,7],[4,8],[4,6]],"targetSize":31,"targetIsHard":false}],"stars":[[0,3],[2,4],[3,6],[3,8],[5,4],[5,6],[4,0],[4,2],[6,1],[7,5],[7,3],[8,1],[0,5],[1,7],[6,8],[8,7],[1,0],[2,2]],"solutionCount":1}')
    // newPuzzle.regions = tmp.regions;
    // newPuzzle.stars = tmp.stars;


    // 2. Prepare a fresh grid and strategy grid
    const newGrid = GridUtils.createPuzzleGrid(newPuzzle)
    const strategyGrid = createStrategyGrid(newGrid, newPuzzle)
    strategyGrid.stars = []; // start with no stars placed


    console.log('%cStarting Strategies for puzzle', 'color: red')

    let strategyCount = 0;
    let strategyDifficulty = 0;

    let loopCount = 0;

    // 3. Keep applying human strategies until solved or stuck
    while (true) {
      loopCount++
     
      // console.log(`Strategy ${strategyCount}`)

      if (loopCount > 100) return null; // FAILSAFE

      const strategyResults = runHumanSolver(strategyGrid) || [];


      if (strategyResults.length === 0) {
        // No more human strategies -> stuck (unsolvable)
        console.log(':-( Stuck!')
        break;
      }

      // GridUtils.logGrid(strategyGrid)


      // Apply all found strategies to the working grid
      //for (const result of strategyResults) {

      
        const result = strategyResults[0]

        applyResultCellsToGrid(strategyGrid, result);
        strategyDifficulty += result.difficulty
        strategyCount ++;
        
      //}

      // console.log(`%cApplied strategy`, 'color:red')
      //
        



      // Check if puzzle is completely solved
      if (GridUtils.isSolved(strategyGrid, newPuzzle)) {

        // Found a solvable puzzle!
        console.log(`%cFOUND SOLVABLE PUZZLE IN ${loopCount} TRIES!`, 'color: green; font-weight: bold')
        console.log(`%cDIFFICULTY: ${strategyDifficulty}\nCOUNT:${strategyCount}`, 'color: green')

        GridUtils.logGrid(strategyGrid)


        //newPuzzle.difficulty = str

        newPuzzle.strategyTotalCount = strategyCount
        newPuzzle.strategyTotalDifficulty = strategyDifficulty


        return newPuzzle;
      }
    }
    // if we get here the puzzle wasn’t fully solved -> try again
  }

  // Tried 100 times without success
  console.log('generateUniqueSolvablePuzzle: no solvable puzzle found after 100 attempts');
  return null;
}



export function isStarPlacementValid(puzzle: Puzzle, grid: Grid, r: number, c: number): boolean {
  const cell = grid.cells[r][c];
  if (cell.value === -1) return false; // already a star
  if (cell.value > 0) return false; // eliminated

  const N = 2; // stars per row/col/region

  // Row check
  const rowStars = grid.cells[r].filter(c => c.value === -1).length;
  if (rowStars >= N) return false;

  // Column check
  const colStars = grid.cells.map(row => row[c].value).filter(v => v === -1).length;
  if (colStars >= N) return false;

  // Region check
  const region = puzzle.regions.find(rg => rg.id === cell.ownerId);
  const regionStars = region?.coords.map(([rr, cc]) => grid.cells[rr][cc].value)
    .filter(v => v === -1).length ?? 0;
  if (regionStars >= N) return false;

  // Adjacent / diagonal check
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < grid.size && nc >= 0 && nc < grid.size) {
        if (grid.cells[nr][nc].value === -1) return false;
      }
    }
  }

  return true;
}

/**
 * 
 * Returns a puzzle with solutionCount and stars filled in if unique solution.
 * 
 * solutionCount:
 * 0 = no solution
 * 1 = unique solution
 * 2 = multiple solutions
 * 
 * Fills the grid with stars if unique solution,
 * or with the last attempted stars if no solution.
 */
export function solveStarsUniqueness(puzzle: Puzzle): Puzzle {

  // Temporary grid to work with
  const grid = createGrid(puzzle.size);

  // Assign regions from puzzle
  puzzle.regions.forEach(region => {
    region.coords.forEach(([r, c]) => {
      grid.cells[r][c].ownerId = region.id;
    });
  });

  const starsPer = puzzle.starsPer

  const regionSizes = new Map<number, number>();
  puzzle.regions.forEach(r => regionSizes.set(r.id, r.coords.length));

  const coords: [number, number][] = grid.cells
    .flatMap((row, r) => row.map((_, c) => [r, c] as [number, number]))
    .sort((a, b) =>
      (regionSizes.get(grid.cells[a[0]][a[1]].ownerId!) ?? 0) -
      (regionSizes.get(grid.cells[b[0]][b[1]].ownerId!) ?? 0)
    );

  const rowCounts = Array(grid.size).fill(0);
  const colCounts = Array(grid.size).fill(0);
  const regionCounts = new Map<number, number>();

  let solutionCount = 0;
  //let lastAttemptStars: [number, number][] = [];
  let uniqueStars: [number, number][] = [];
  const currentStars: [number, number][] = [];

  function remainingStarsPossible(idx: number): boolean {
    // Check rows
    for (let r = 0; r < grid.size; r++) {
      const need = starsPer - rowCounts[r];
      const left = coords.slice(idx).filter(([rr, cc]) => rr === r && grid.cells[rr][cc].value === 0).length;
      if (left < need) return false;
    }
    // Check columns
    for (let c = 0; c < grid.size; c++) {
      const need = starsPer - colCounts[c];
      const left = coords.slice(idx).filter(([rr, cc]) => cc === c && grid.cells[rr][cc].value === 0).length;
      if (left < need) return false;
    }
    // Check regions
    for (const region of puzzle.regions) {
      const need = starsPer - (regionCounts.get(region.id) ?? 0);
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
      // console.log(`Solution #${solutionCount} found, stars:`, currentStars);
      if (solutionCount === 1) uniqueStars = [...currentStars];
      return;
    }

    if (!remainingStarsPossible(idx)) {
      //lastAttemptStars = [...currentStars];
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
      rowCounts[r] < starsPer &&
      colCounts[c] < starsPer &&
      (regionCounts.get(regionId) ?? 0) < starsPer &&
      isStarPlacementValid(puzzle, grid, r, c)
    ) {
      // Place star
      cell.value = -1;
      rowCounts[r]++; colCounts[c]++;
      regionCounts.set(regionId, (regionCounts.get(regionId) ?? 0) + 1);
      currentStars.push([r, c]);


      // Mark adjacent cells as eliminated
      const eliminated: [number, number][] = [];
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
  //grid.cells.forEach(row => row.forEach(cell => cell.value = 0));
  //const starsToFill = solutionCount === 1 ? uniqueStars : lastAttemptStars;
  //starsToFill.forEach(([r, c]) => grid.cells[r][c].value = -1);

  if (solutionCount === 1) {
    puzzle.stars = uniqueStars;
  }

  puzzle.solutionCount = solutionCount === 0 ? 0 : solutionCount === 1 ? 1 : 2;

  return puzzle;
}


