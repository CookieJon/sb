

import { useGameState } from './store/gameContext';
import { Box, Button, Container, Flex, Grid, GridItem, Heading, HStack, Link, Spacer, Text, VStack } from '@chakra-ui/react';
import './App.css'  
import { useEffect, useState } from 'react';
import PageHome from './components/PageHome';
import PageMenu from './components/PageMenu';
import PageGame from './components/PageGame';

type Page = "home" | "menu" | "game";

function App() {

  // State
  const [page, setPage] = useState<Page>("home");

  function goToPage(newPage: Page) {
    setPage(newPage);
    //window.history.pushState({ page: newPage }, "", ""); // empty URL keeps same path
     window.history.pushState({ page: "menu" }, "", "/menu");  // write url

  }

  // Read url on load
  useEffect(() => {
    const path = window.location.pathname.replace("/", "");
    if (["home","menu","game"].includes(path)) {
      setPage(path as Page);
    }
  }, []);

  // Capture browser "Back" event
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const state = e.state as { page?: Page };
      if (state?.page) {
        setPage(state.page);
      } else {
        // optional: default if no state found
        setPage("home");
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);



  return (
    <>

    <Flex direction="column" minH="100vh"  px={0}>

      {/* Header */}
      <Box as="header" bg="teal.500" color="white" py={4}>
        <Container maxW="container.md" display="flex" alignItems="center">
          <Heading size="md">★ Star Battle ★</Heading>
          <Spacer />
          <HStack>
            <Link href="#" _hover={{ textDecoration: 'underline' }}>Home</Link>
            {/* <Link href="#" _hover={{ textDecoration: 'underline' }}>About</Link>
            <Link href="#" _hover={{ textDecoration: 'underline' }}>Contact</Link> */}
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.md" flex="1" py={8}>

        {/* Home Page */}
        {page === "home" && 
          <PageHome 
            onStart={() => goToPage("menu")} 
          />
        }
        {/* Menu Page */}
        {page === "menu" && 
          <PageMenu 
            onBack={() => goToPage("home")} 
            onSelectDifficulty={() => goToPage("game")}
          />
        }
        {/* Game Page */}
        {page === "game" && 
          <PageGame 
            onBack={() => goToPage("menu")} 
          />
        }

      </Container>
      

      {/* Footer */}
        <Box p={6} bg="gray.50" borderRadius="md" boxShadow="sm">
          <Text>
            You can add more sections here, like cards, forms, or any content. Chakra UI handles spacing and responsiveness easily.
          </Text>
          <Button mt={4} colorScheme="teal">
            Get Started
          </Button>
        </Box>
        {/* Footer */}
        <Box as="footer" bg="teal.600" color="white" py={4}>
          <Container maxW="container.md" textAlign="center">
            <Text>© 2025 My App. All rights reserved.</Text>
          </Container>
        </Box>
          
    </Flex>




    </>
  )
}

export default App

