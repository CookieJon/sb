import { useState } from 'react'
import  { GridUtils, type Grid } from "./factories"
import { findSolution, generateUniqueGrid } from "./utils/solutionUtils"
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





  
  return (
    <>

      <div className="card">

        <div className="app">
          <h3> Example</h3>
          <div className={`grid solution-count-${grid.solutionCount}`}>
            {grid.cells.map((row, r) => (
              <div key={r} className="row">
                {row.map((cell) => (
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
  

  <button onClick={() => findSolution(grid, setGrid)}>SOLVE</button>

  <button onClick={() => generateUniqueGrid(setGrid)}>GENERATE</button>

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

