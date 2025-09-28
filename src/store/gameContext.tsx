import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import type { Game, Grid } from '../factories';

// --- Types ---
type Theme = 'light' | 'dark';

export interface GameState {
  theme: Theme;
  difficulty: 'easy' | 'medium' | 'hard';
  game: Game | null;
}

// --- Actions ---
type Action =
  | { type: 'SET_THEME'; payload: GameState['theme'] }
  | { type: 'SET_DIFFICULTY'; payload: GameState['difficulty'] }
  | { type: 'SET_GRID'; payload: Grid }
  | { type: 'UPDATE_CELL'; payload: Grid }
  | { type: 'UPDATE_GAME'; payload: Game } 
  | { type: 'UPDATE_GRID'; payload: Grid } 
  | { type: 'UPDATE_LAST_CHECK_VALID'; payload: boolean } 

// --- Initial State ---
const initialState: GameState = {
  theme: 'light',
  difficulty: 'easy',
  game: null
};

// --- Reducer ---
function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    // case 'SET_GRID':
    //   return { ...state, grid: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.payload };
    case 'UPDATE_CELL':
      return {
        ...state,
        game: state.game ? { 
          ...state.game, 
          grid: action.payload 
        } : null
      };
    case 'UPDATE_GAME':
        return { ...state, game: action.payload };          
    case 'UPDATE_GRID':
      return {
        ...state,
        game: state.game ? { 
          ...state.game, 
          grid: action.payload 
        } : null
      };   
    
    default:
      return state;
  }
}

// --- Contexts ---
const GameStateContext = createContext<GameState | undefined>(initialState);
const GameDispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

// --- Provider ---
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
};

// --- Hooks for convenience ---
export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameProvider');
  return ctx;
}

export function useGameDispatch() {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error('useGameDispatch must be used within GameProvider');
  return ctx;
}
