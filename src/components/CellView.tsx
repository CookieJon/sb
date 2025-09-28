import type { Cell } from "../factories/cellFactory";


interface Props {
  cell: Cell;
  onCellClick: (cell: Cell) => void;
}

export function CellView({ cell, onCellClick }: Props) {



    const classes = ['cell']

    // Add border classes based on bitmask
    const borderMask = cell.borders ?? 0    
    if (borderMask & 1) classes.push('border-top')
    if (borderMask & 2) classes.push('border-right')
    if (borderMask & 4) classes.push('border-bottom')
    if (borderMask & 8) classes.push('border-left')
      
    const hintMask = cell.hintGroup ?? 0
    if (hintMask & 1) classes.push('hint-eliminated')
    if (hintMask & 2) classes.push('hint-star')
    if (hintMask & 4) classes.push('hint-group-1')
    if (hintMask & 8) classes.push('hint-group-2')

    // Add a class for the region
    classes.push(cell.ownerId ? `region-${cell.ownerId}` : '')

    // Add class based on value    
    if (cell.value === 0) classes.push('empty');
    else if (cell.value > 0) classes.push('eliminated');
    else if (cell.value === -1) classes.push('star');

    // Add class based on validation
    if (cell.isValid === false) classes.push('invalid')

    const handleClick = () => {
        onCellClick(cell)
    }

    return <div 
        className={classes.join(' ')}
        onClick={handleClick} >
          {/* <span>{cell.ownerId}{cell.hintGroup}</span> */}
        </div>
        
}
