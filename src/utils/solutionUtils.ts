// --- Star placement validity ---

import { GridUtils, type Grid } from "../factories";

export function isStarPlacementValid(grid: Grid, r: number, c: number): boolean {
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
  const region = grid.regions.find(rg => rg.id === cell.ownerId);
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
 * Returns:
 * 0 = no solution
 * 1 = unique solution
 * 2 = multiple solutions
 * 
 * Fills the grid with stars if unique solution,
 * or with the last attempted stars if no solution.
 */
export function solveStarsUniqueness(
  grid: Grid,
  starsPerRowCol = 2,
  starsPerRegion = 2
): Grid {
  const regionSizes = new Map<number, number>();
  grid.regions.forEach(r => regionSizes.set(r.id, r.coords.length));

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
  let lastAttemptStars: [number, number][] = [];
  let uniqueStars: [number, number][] = [];
  const currentStars: [number, number][] = [];

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
      // console.log(`Solution #${solutionCount} found, stars:`, currentStars);
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
      isStarPlacementValid(grid, r, c)
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
  grid.cells.forEach(row => row.forEach(cell => cell.value = 0));
  const starsToFill = solutionCount === 1 ? uniqueStars : lastAttemptStars;
  starsToFill.forEach(([r, c]) => grid.cells[r][c].value = -1);

  grid.solutionCount = solutionCount === 0 ? 0 : solutionCount === 1 ? 1 : 2;

  return grid;
}


export function findSolution(grid: Grid, setGrid: (g: Grid) => void) {
  const grid2 = GridUtils.cloneGrid(grid);
  console.log('<hr>');
  solveStarsUniqueness(grid2, 2, 2);
  console.log("Solutions found:", grid2.solutionCount);
  setGrid(grid2);
}

export function generateUniqueGrid(setGrid: (g: Grid) => void) {
  let attempts = 0;
  let uniqueFound = false;
  let newGrid = GridUtils.createGrid(9);
  newGrid = GridUtils.createRegions(newGrid, 9);

  while (attempts < 10000 && !uniqueFound) {
    attempts++;
    newGrid = GridUtils.createGrid(9);
    newGrid = GridUtils.createRegions(newGrid, 9);
    setGrid(newGrid);
    const grid = solveStarsUniqueness(newGrid);
    const result = grid.solutionCount;
    if (result === 1) {
      uniqueFound = true;
      console.log(`Unique solution found after ${attempts} attempt(s)!`);
      break;
    }
    if (result === 2) {
      console.log(`2 solutions found after ${attempts} attempt(s). Retrying...`);
    }
    setGrid(grid);
  }
  if (!uniqueFound) {
    console.log(`No unique solution found in ${attempts} attempts.`);
  }
}
