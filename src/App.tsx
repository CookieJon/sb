import { useState } from 'react'
import  { GridUtils, type Grid } from "./factories"
import './App.css'
import { CellView } from './components/CellView'

function App() {
  const [count, setCount] = useState(0)

  const [grid, setGrid] = useState<Grid>(() => GridUtils.createGrid(9)) // 5x5 grid

  // This *is* the onValueChange we pass down
  const handleValueChange = (row: number, col: number, newValue: 0 | 1 | 2) => {
    setGrid(grid => {
      const next = GridUtils.cloneGrid(grid);

      const cell = next.cells[row][col];

      // Cycle value: 0 -> 1 -> 2 -> 0
      cell.value = newValue;

      if (newValue === 2) {
        // Place a star: mark all surrounding cells as eliminated (1)
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = row + dr;
            const c = col + dc;
            if (
              r >= 0 &&
              r < next.size &&
              c >= 0 &&
              c < next.size &&
              next.cells[r][c].value === 0
            ) {
              next.cells[r][c].value = 1;
            }
          }
        }
      }

      return next;
    })
  }


  const findSolution = () => { 
    const grid2 = GridUtils.cloneGrid(grid);
    
    console.log('<hr>');
    GridUtils.solveStarsUniqueness(grid2, 2, 2);
    console.log("Solutions found:", grid2.solutionCount);
    setGrid(grid2)
  }

  const generateUniqueGrid = () => {
    let attempts = 0;
    let uniqueFound = false;
    let newGrid = GridUtils.createGrid(9);
    newGrid = GridUtils.createRegions(newGrid, 9);
  
  
    while (attempts < 100 && !uniqueFound) {
      attempts++;
      newGrid = GridUtils.createGrid(9);
      newGrid = GridUtils.createRegions(newGrid, 9);

      setGrid(newGrid);

        const grid = GridUtils.solveStarsUniqueness(newGrid)
        const result = grid.solutionCount




        if (result === 1) {
          uniqueFound = true;
          
          console.log(`Unique solution found after ${attempts} attempt(s)!`);
          console.log("Unique grid generated:", newGrid);
          break;
        }

        if (result === 2) {
          console.log(`2 solutions found after ${attempts} attempt(s). Retrying...`);
        }

        setGrid(grid);

      }

      if (!uniqueFound) {
        console.log(`No unique solution found in 50 attempts.`);
        
      }

    return


    };


  
  return (
    <>

      <div className="card">

        <div className="app">
          <h3> Example</h3>
          <div className={`grid solution-count-${grid.solutionCount}`}>
            {grid.cells.map((row, r) => (
              <div key={r} className="row">
                {row.map((cell, c) => (
                  <CellView 
                    key={cell.coords.join('-')} 
                    cell={cell} 
                    onValueChange={handleValueChange}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      

      <button onClick={() => setGrid(GridUtils.createRegions(grid, 9))}>MAKE REGIONS</button>
  
      <button onClick={findSolution}>SOLVE</button>   

       <button onClick={generateUniqueGrid}>GENERATE</button>   

      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>

    </div>

    <pre style={{ background: "#eee", padding: "1em", width: "500px"}}>
      {JSON.stringify(grid.cells, null, 0)}
    </pre>

    </>
  )
}

export default App

