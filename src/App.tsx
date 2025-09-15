import { useState } from 'react'
import  { GridUtils, type Grid } from "./factories"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const [grid, setGrid] = useState<Grid>(() => GridUtils.createGrid(9)) // 5x5 grid



  return (
    <>

      <div className="card">

        <div className="app">
          <h3> Example</h3>
          <div className="grid">
            {grid.cells.map((row, rIndex) => (
              <div key={rIndex} className="row">
                {row.map((cell) => (
                  <div key={`${cell.row}-${cell.col}`} className={'cell ' + (cell.ownerId ? `region-${cell.ownerId}` : '')}>
                    {cell.ownerId  || "."}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      

      <button onClick={() => setGrid(GridUtils.createRegions(grid, 9))}>MAKE REGIONS</button>
      <button onClick={() => setGrid(GridUtils.growRegions(grid))}>GROW REGIONS</button>
        
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
