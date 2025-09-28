// Home.jsx
import { Box, Button, Heading, VStack } from "@chakra-ui/react";

export default function PageHome({ onStart }: { onStart: () => void }) {
  return (
    <Box textAlign="center" py={10} px={6}>
      <VStack spaceY={6}>
        <Heading as="h1" size="2xl">
          Star Battle
        </Heading>
        <Button colorScheme="teal" size="lg" onClick={onStart}>
          Go to Menu
        </Button>
      </VStack>
    </Box>
  );
}
