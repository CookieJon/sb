import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GameProvider } from './store/gameContext';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <ChakraProvider value={defaultSystem}>
      <App />
      </ChakraProvider>
    </GameProvider>
  </React.StrictMode>
);
