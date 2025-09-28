// PuzzleUtils.ts
import type { Coord, Puzzle } from "../factories/index.ts";
import { GridUtils } from "./gridUtils.ts";

export const PuzzleUtils = {

    // -------------------
    // Generate a random puzzle with regions
    // -------------------
    generatePuzzle(size: number, starsPer: number): Puzzle {

        // Generates a random puzzle that has no guarantee of solution or uniqueness.

        // 1. Create regions
        const regions = GridUtils.createRegions(size); //

        return {
            id: crypto.randomUUID(),
            size,
            starsPer,
            regions,
            stars: [],              // the solution
            solutionCount: -1,      // -1 = uncounted
            difficulty: undefined,
            strategyTotalCount: 0,
            strategyTotalDifficulty: 0
        };

    },


  clonePuzzle(puzzle: Puzzle): Puzzle {
    return {
        ...puzzle,
        stars: puzzle.stars.map(([r, c]) => [r, c] as Coord),
        regions: puzzle.regions.map(region => ({
        ...region,
        coords: region.coords.map(([r, c]) => [r, c] as Coord)
        }))
    };

}


};
