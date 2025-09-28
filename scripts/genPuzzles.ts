// scripts/genPuzzles.ts
import { generateUniqueSolvablePuzzle } from '../src/utils/solutionUtils.ts'; // adjust path if needed

const SIZE = 9;
const STARS_PER = 2;

for (let i = 0; i < 5; i++) {
  console.log('--------------------------------------------------------------------')
  console.log(`Attempt ${i + 1}:`);
  console.log('--------------------------------------------------------------------')
  const puzzle = generateUniqueSolvablePuzzle(SIZE, STARS_PER);  
  console.log(`Attempt ${i + 1}:`, puzzle ? "✅ Puzzle generated" : "❌ No puzzle");
}
