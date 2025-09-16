import type { Cell } from "../factories/cellFactory";



interface Props {
  cell: Cell;
  onValueChange: (row: number, col: number, newValue: 0 | 1 | 2) => void;
}

export function CellView({ cell, onValueChange }: Props) {

    const mask = cell.borders ?? 0
    const classes = ['cell']

    if (mask & 1) classes.push('border-top')
    if (mask & 2) classes.push('border-right')
    if (mask & 4) classes.push('border-bottom')
    if (mask & 8) classes.push('border-left')
    classes.push(cell.ownerId ? `region-${cell.ownerId}` : '')
    // Add a class based on the value for styling
    if (cell.value === 1) classes.push('eliminated');
    else if (cell.value === 2) classes.push('star');

    const handleClick = () => {
        const next = cell.value === 0 ? 1 : cell.value === 1 ? 2 : 0;
        onValueChange(cell.coords[0], cell.coords[1], next);
    }

    return <div 
        className={classes.join(' ')}
        onClick={handleClick} />
        
}
