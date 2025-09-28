// hooks/useGridActions.ts
import { type Cell, createGame, createStrategyGrid } from '../factories';
import { useGameState, useGameDispatch } from '../store/gameContext';

import { GridUtils } from '../utils/gridUtils';
import { PuzzleUtils } from '../utils/puzzleUtils';
import * as Solu from '../utils/solutionUtils';
import { applyResultCellsToGrid, applyHintCellsToGrid } from '../utils/strategyLibrary';
import { runHumanSolver } from '../utils/strategyUtils';


export function useGridActions() {

  // Access state and dispatch
  const { game } = useGameState();  
  const dispatch = useGameDispatch();

  // Handlers 

  // BUTTON EVENTS 


    
    // SHOW HINT
    // Show the next hint fromt the strategy solver
  const handleHintClick = () => {
    if (!game?.grid || !game?.puzzle) return;
    const strategyGrid = createStrategyGrid(game.grid, game.puzzle) // Move all this to the strategy solver function...?
    strategyGrid.stars = []
    const strategyResults = runHumanSolver(strategyGrid) || [];
    const newGrid = structuredClone(game.grid);
    //applyResultCellsToGrid(newGrid, strategyResults[0])  // Apply the result to the game grid.
    applyHintCellsToGrid(newGrid, strategyResults[0]);
    console.log(newGrid)
    console.log(`Applied Strategy: ${strategyResults[0]?.explanation}`)
    game.message = strategyResults[0]?.explanation
    dispatch({ type: 'UPDATE_GRID', payload: newGrid})
  };  


  // Applyt  next hint fromt the strategy solver
  // APPLY IT
  const handleAcceptClick = () => {
    if (!game?.grid || !game?.puzzle) return;
    const strategyGrid = createStrategyGrid(game.grid, game.puzzle) // Move all this to the strategy solver function...?
    strategyGrid.stars = []
    const strategyResults = runHumanSolver(strategyGrid) || []
    const newGrid = structuredClone(game.grid)
    GridUtils.clearValidation(newGrid)
    game.message=''
    applyResultCellsToGrid(newGrid, strategyResults[0])  // Apply the result to the game grid.
    const isSolved = GridUtils.isSolved(newGrid, game.puzzle)
    game.message = isSolved ? ' Solved ! ' : ' Unsolved '    
    console.log(`Applied Strategy: ${strategyResults[0]?.explanation}`)
    console.log(game.message)
    dispatch({ type: 'UPDATE_GRID', payload: newGrid})
  };  




  // Make a new game from a random puzzle 
  const handleRandomClick = () => {
    const puzzle = PuzzleUtils.generatePuzzle(9, 2); 


    let tmp = JSON.parse('{"id":"c3413402-d399-46f3-8139-7fd80a8bb47f","size":9,"starsPer":2,"regions":[{"id":1,"coords":[[1,4],[0,4],[0,3],[1,3],[2,4]],"targetSize":5,"targetIsHard":true},{"id":2,"coords":[[6,6],[5,6],[5,5],[5,4],[4,5]],"targetSize":5,"targetIsHard":true},{"id":3,"coords":[[3,7],[3,6],[3,8],[3,5],[2,7]],"targetSize":5,"targetIsHard":true},{"id":4,"coords":[[8,2],[7,2],[8,1],[8,0],[7,3],[7,0],[6,0],[7,4],[8,4],[8,3]],"targetSize":6,"targetIsHard":false},{"id":5,"coords":[[0,6],[0,7],[1,6],[1,5],[2,6],[1,7],[1,8],[0,8],[2,8],[0,5],[2,5]],"targetSize":9,"targetIsHard":false},{"id":6,"coords":[[5,2],[5,1],[4,2],[5,3],[4,3],[5,0],[4,0],[4,4],[3,4]],"targetSize":3,"targetIsHard":false},{"id":7,"coords":[[4,1],[3,1],[3,2],[2,1],[2,2],[1,2],[3,0],[0,2],[2,3],[3,3],[1,1],[0,1],[1,0],[2,0],[0,0]],"targetSize":8,"targetIsHard":false},{"id":8,"coords":[[6,3],[6,2],[6,1],[7,1],[6,4],[6,5],[7,5],[8,5],[8,6]],"targetSize":9,"targetIsHard":false},{"id":9,"coords":[[7,8],[6,8],[6,7],[7,7],[5,7],[8,8],[8,7],[7,6],[5,8],[4,7],[4,8],[4,6]],"targetSize":31,"targetIsHard":false}],"stars":[[0,3],[2,4],[3,6],[3,8],[5,4],[5,6],[4,0],[4,2],[6,1],[7,5],[7,3],[8,1],[0,5],[1,7],[6,8],[8,7],[1,0],[2,2]],"solutionCount":1}')

    puzzle.regions = tmp.regions

    const newGame = createGame(puzzle);
    dispatch({ type: 'UPDATE_GAME', payload: newGame});
  };


  // Generate a unique & solvable new puzzle
  const handleGenerateClick = () => {
    const puzzle = Solu.generateUniquePuzzle(9, 2);
    if (!puzzle) return;  // if no unique puzzle found, do nothing
    const newGame = createGame(puzzle);
    dispatch({ type: 'UPDATE_GAME', payload: newGame});
  };  



  // Generate 2 - Find a unique puzzle that can be solved with strategies.
  const handleGenerate2Click = () => {
    const puzzle = Solu.generateUniqueSolvablePuzzle(9, 2);
    if (game) game.message = 'FAILED TO FIND A PUZZLE. TRY AGAIN.';
    if (!puzzle) return;  // if no unique puzzle found, do nothing
    const newGame = createGame(puzzle);
    newGame.message = `DIFFICULTY: ${puzzle.strategyTotalDifficulty}    MOVES: ${puzzle.strategyTotalCount}`

    dispatch({ type: 'UPDATE_GAME', payload: newGame});
  };  



  // Apply puzzle's solution to the grid
  const handleSolveClick = () => {
    if (!game?.puzzle) return;
    const newGrid = structuredClone(game.grid);
    GridUtils.applySolution(game.puzzle, newGrid);
    game.message=''
    dispatch({ type: 'UPDATE_GRID', payload: newGrid });
  };


  // Validate current grid against puzzle's solution
  const handleCheckClick = () => {
    if (!game?.grid || !game?.puzzle) return;
    const newGrid = structuredClone(game.grid);
    GridUtils.applyValidation(game.puzzle, newGrid);
    game.message =newGrid.errorCount > 0 ? `THERE ARE ${newGrid.errorCount} MISTAKES` : 'NO MISTAKES'


    dispatch({ type: 'UPDATE_GRID', payload: newGrid});
  };



  const handleClearClick = () => {
    if (!game?.puzzle) return;
    const newGrid = GridUtils.createPuzzleGrid(game.puzzle)
    dispatch({ type: 'UPDATE_GRID', payload: newGrid});
  };


  // GRID CELL EVENTS
  // Click a cell
  const handleCellClick = (cell: Cell) => {
    if (!game?.grid) return;
    const newGrid = GridUtils.updateCell(game.grid, cell)
    dispatch({ type: 'UPDATE_GRID', payload: newGrid});
  };

  // Return state and handlers
  return {
    game, 
    handleRandomClick,
    handleSolveClick,
    handleCellClick,      
    handleGenerateClick,    
    handleGenerate2Click,
    handleCheckClick,
    handleClearClick,
    handleHintClick,
    handleAcceptClick
    };
}
