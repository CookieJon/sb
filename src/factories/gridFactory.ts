// src/factories/gridFactory.ts
import type { Cell, Region } from "../factories/index.ts";
import {createCell} from "../factories/index.ts"; // for functions
import { GridUtils } from "../utils/gridUtils.ts";


export type Coord = [number, number]

export type Difficulty = 'easy' | 'medium' | 'hard';


// ---- Game session (optional) ----
export interface Game {
  puzzle: Puzzle;      // immutable definition with solutionCount
  message?: string;      // Message to display for validation, hints, etc.
  grid: Grid;          // player’s current state
  history?: Grid[];    // undo/redo if desired
}

// Puzzle represents a definition of a puzzle with its solution
// (regions and star positions) but not the current state of play
export interface Puzzle {
    id: string;
    size: number;               // grid size (e.g., 9 for 9x9)
    starsPer: number;          // stars per row/col/region
    stars: Coord[];              // star locations - the solution (may be empty if solutionCount != 1)
    regions: Region[];
    solutionCount: -1 | 0 | 1 | 2;     // -1 = uncounted. 
    strategyTotalDifficulty: number;
    strategyTotalCount: number;
    difficulty?: Difficulty;
}

// Grid represents the current state of the puzzle including cells and their states
// 
export interface Grid {
    size: number
    cells: Cell[][]
    lastCheckValid: boolean | null
    errorCount: number    
}

// Puzzle represents the definition of a puzzle with its solution
export function createPuzzle(size: number, starsPer: number, regions: Region[]): Puzzle {

    return {    
        id: crypto.randomUUID(),
        size,
        starsPer,
        stars: [],      
        regions,
        solutionCount: -1,
        strategyTotalCount: 0,
        strategyTotalDifficulty: 0
    };
}   

export function createGrid(size: number): Grid {
    const cells: Cell[][] = Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => createCell([row, col]))
    );
    return { 
        size, 
        cells,
        lastCheckValid: null,
        errorCount: 0
    };
}


export function createGame(puzzle: Puzzle): Game {  
    // Create a game from a puzzl definition    
    return {
        puzzle,
        grid: GridUtils.createPuzzleGrid(puzzle),  // Create a grid with cells aware of the puzzle's regions & borders
        history: []
    };
}





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

