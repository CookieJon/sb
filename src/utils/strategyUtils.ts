
import {type StrategyGrid, type StrategyResult } from "../factories/strategyFactory.ts";
import { ALL_STRATEGIES } from "./strategyLibrary.ts";


// MAIN STARTING POINT
// 
export function runHumanSolver(
  grid: StrategyGrid
): StrategyResult[] | null {

    // LOOP THROUGH THE STRATEGIES

    // console.log('Strategy Grid', grid);

    const strategies = ALL_STRATEGIES;

    let results: StrategyResult[] = []

    for (const strategy of strategies) {

       // console.log(`Testing strategy: ${strategy.name}`);

        // Disable to run all strategies

        results.push(...strategy.apply(grid));

        if (results.length > 0) {
        //  console.log(`Strategy worked`);

          break; // Disable to run more strategies          

        } else {
       //   console.log(`Strategy failed`)
        }
    
        
    }

    results.sort((a, b) => a.difficulty - b.difficulty);  // Easier first

   // console.table(results, ["difficulty", "explanation", "resultCells"])

    return results

}

// Optional - return all
// export function runHumanSolverAll(
//   grid: StrategyGrid,
//   strategies: Strategy[]
// ): StrategyResult[] {
//   return strategies
//     .map(s => s.apply(grid))
//     .filter((r): r is StrategyResult => r.applied);
// }



// UTILS FUNCTIONS

