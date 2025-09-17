import type { Cell } from "../factories/cellFactory";


interface Props {
  cell: Cell;
  onCellClick: (cell: Cell) => void;
}

export function CellView({ cell, onCellClick }: Props) {

    const mask = cell.borders ?? 0
    const classes = ['cell']

    // Add border classes based on bitmask
    if (mask & 1) classes.push('border-top')
    if (mask & 2) classes.push('border-right')
    if (mask & 4) classes.push('border-bottom')
    if (mask & 8) classes.push('border-left')
      
    // Add a class for the region
    classes.push(cell.ownerId ? `region-${cell.ownerId}` : '')

    // Add class based on value    
    if (cell.value === 0) classes.push('empty');
    else if (cell.value > 0) classes.push('eliminated');
    else if (cell.value === -1) classes.push('star');

    const handleClick = () => {
        onCellClick(cell)
    }

    return <div 
        className={classes.join(' ')}
        onClick={handleClick} />
        
}
