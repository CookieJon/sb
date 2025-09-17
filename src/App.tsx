import { useState } from 'react'
import  { GridUtils, type Cell, type Grid } from "./factories"
import { findSolution, generateUniqueGrid } from "./utils/solutionUtils"
import './App.css'
import { CellView } from './components/CellView'

function App() {
  const [count, setCount] = useState(0)

  const [grid, setGrid] = useState<Grid>(() => GridUtils.createGrid(9)) 


  const surroundingOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1]
  ];    

  // This *is* the onValueChange we pass down
  const handleValueChange = (cell: Cell) => {

    // Destructure cell to get row, col, value
    const { coord: [row, col], value } = cell;

    // Cycle value 0 - Empty -> 1 - Eliminated -> -1 - Star -> 0 - Empty
    const newValue = value === 0 ? 1 : value > 0 ? -1 : 0;

    setGrid(grid => {

      const next = GridUtils.cloneGrid(grid);
      
      const cell = next.cells[row][col];

      // Cycle value: 0 -> 1 -> 2 -> 0
      cell.value = newValue;

      // Affect surrounding cells        

      if (newValue === -1) {
        // Adding star: increment empty or eleminated cells by 1
        surroundingOffsets.forEach(([dr, dc]) => {  
              const r = row + dr;
              const c = col + dc;
              if (r >= 0 && r < next.size && c >= 0 && c < next.size && value >= 0) {
                next.cells[r][c].value++;
              }
          });

      } else if (value == -1 && newValue == 0) {
        // Removing a star: decrement eliminated cells (1-)
        surroundingOffsets.forEach(([dr, dc]) => {  
              const r = row + dr;
              const c = col + dc;
              if (r >= 0 && r < next.size && c >= 0 && c < next.size && value) {
                next.cells[r][c].value--;
              }
          });
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
                    key={cell.coord.join('-')} 
                    cell={cell} 
                    onCellClick={handleValueChange}
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

