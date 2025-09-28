
// Home.jsx
import { Box, Button,Flex,Grid,GridItem,HStack,VStack } from "@chakra-ui/react";
import { useGridActions } from "../hooks/useGridActions";

import { CellView } from '../components/CellView'


import { useGameState } from '../store/gameContext';



export default function PageGame( { onBack }: { onBack: () => void }) {


    // Custom Hooks (event handlers)
    const { handleHintClick, handleAcceptClick, handleCellClick, handleSolveClick, handleRandomClick,
             handleGenerateClick, handleGenerate2Click, handleCheckClick, handleClearClick } = useGridActions();
  
  const { game } = useGameState();


  return (

      <VStack align="stretch" spaceY={6} >

        {/* Buttons */}

        <HStack spaceX={4}>


          <Button
            size="xs"              // small size
            variant="subtle"
            colorScheme="teal"     // muted color
            fontSize="0.5rem"     // tiny text
            px={3} py={1}          // small padding
            onClick={handleHintClick}
          >
            HINT
          </Button>
          <Button
            size="xs"              // small size
            variant="subtle"
            colorScheme="teal"     // muted color
            fontSize="0.5rem"     // tiny text
            px={3} py={1}          // small padding
            onClick={handleAcceptClick}
          >
            ACCEPT HINT
          </Button>
          <Button
            size="xs"              // small size
            variant="subtle"
            colorScheme="teal"     // muted color
            fontSize="0.5rem"     // tiny text
            px={3} py={1}          // small padding
            onClick={handleGenerate2Click}
          >
            GENERATE 2
          </Button>


        </HStack>
       




          {/* Grid */}
          <Flex w="100%" h="100%" align="center" justify="center" id="GridContainerCenterer">

                <Box
                  id="GridContainer"
                  position="relative"
                  w="100%"                // fill parent container
                  maxW={{ base: "100%", md: "400px" }} // max 600px on medium+ screens
                  aspectRatio={1}
                  overflow="hidden"
                  pb={4} // padding-bottom: 1rem (adjust as needed)
                >
                  <Grid
                    id="GameGrid"            
                    className="grid"        
                    w="100%"
                    h="100%"
                    templateRows={`repeat(${game?.grid.cells.length}, 1fr)`}
                    templateColumns={`repeat(${game?.grid.cells[0].length}, 1fr)`}
                    gap={0.0}
                  >
                    {game?.grid.cells.flat().map((cell) => (
                      <GridItem key={cell.coord.join('-')}>
                        <CellView
                          cell={cell}
                          onCellClick={() => handleCellClick(cell)}
                        />
                      </GridItem>
                    ))}
                  </Grid>
                </Box>
                
        </Flex>



          {/* Message Box */}
          {game?.message && 
            <Box
              px={3} py={2}              // padding inside the box
              bg="gray.700"
              color="white"
              borderRadius="md"
              textAlign="center"
              fontSize="xs"              
            >
              {game?.message}
            </Box>
          }





{/* 
            <div className={`grid`}>
              {game?.grid.cells.map((row, r) => (
                <div key={r} className="row">
                  {row.map((cell) => (
                    <CellView 
                      key={cell.coord.join('-')} 
                      cell={cell} 
                      onCellClick={() => handleCellClick(cell)}
                    />
                  ))}
                </div>
              ))}
            </div> */}



      <VStack align="stretch" spaceY={6} >

              
                {/* Top row */}
                                {/* Bottom row */}
                <HStack spaceY={4}>

                    <Button variant="subtle" colorScheme="dark" onClick={handleHintClick}>
                        HINT
                    </Button>
                    <Button variant="solid" onClick={handleAcceptClick}>
                        ACCEPT HINT
                        </Button>
                    <Button variant="outline" onClick={handleCheckClick}>
                        CHECK
                    </Button>
                    {/* Back button */}
                    <Button variant="surface" onClick={onBack}>
                        Back to Menu
                    </Button>
</HStack>

                {/* Bottom row */}
                <HStack spaceY={4}>

                    <Button variant="plain" onClick={handleClearClick}>
                    CLEAR
                    </Button>
                    <Button variant="outline" onClick={handleGenerateClick}>
                    GENERATE
                    </Button>
                    <Button variant="outline" onClick={handleRandomClick}>
                    RANDOM
                    </Button>
                    <Button variant="outline" onClick={handleSolveClick}>
                    SOLVE
                    </Button>

                </HStack>
                </VStack>

                
          <Box p={6} bg="gray.100" borderRadius="md" boxShadow="md">
          </Box>

    </VStack>
  );
}
