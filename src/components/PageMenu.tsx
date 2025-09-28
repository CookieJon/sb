// Menu.tsx
import { Box, Button, Heading, VStack } from "@chakra-ui/react";

interface MenuProps {
  onBack: () => void;
  onSelectDifficulty: (difficulty: string) => void;
}

export default function PageMenu({ onBack, onSelectDifficulty }: MenuProps) {
  return (
    <Box textAlign="center" py={10} px={6}>
      <Heading as="h2" size="xl" mb={6}>
        Select Difficulty
      </Heading>

      <VStack spaceY={4}>
        {["easy", "medium", "hard"].map((diff) => (
          <Button
            key={diff}
            colorScheme="teal"
            width="200px"
            onClick={() => onSelectDifficulty(diff)}
          >
            {diff.charAt(0).toUpperCase() + diff.slice(1)}
          </Button>
        ))}

        <Button variant="outline" onClick={onBack}>
          Back to Home
        </Button>
      </VStack>
    </Box>
  );
}
