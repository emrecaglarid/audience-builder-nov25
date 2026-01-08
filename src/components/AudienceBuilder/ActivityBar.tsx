import { Box, IconButton, VStack } from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/react';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export type PaneType = 'library' | 'ai' | null;

interface ActivityBarProps {
  activePane: PaneType;
  onPaneChange: (pane: PaneType) => void;
}

export function ActivityBar({ activePane, onPaneChange }: ActivityBarProps) {
  const handleClick = (pane: 'library' | 'ai') => {
    // Toggle off if clicking active pane, otherwise switch to it
    if (activePane === pane) {
      onPaneChange(null);
    } else {
      onPaneChange(pane);
    }
  };

  return (
    <Box
      width="56px"
      height="100%"
      bg="gray.50"
      flexShrink={0}
    >
      <VStack gap={2} px={1.5}>
        {/* Library Button */}
        <Tooltip.Root positioning={{ placement: 'right' }} openDelay={300}>
          <Tooltip.Trigger asChild>
            <IconButton
              aria-label="Add criteria"
              size="lg"
              variant="ghost"
              onClick={() => handleClick('library')}
              bg={activePane === 'library' ? 'blue.100' : 'transparent'}
              color={activePane === 'library' ? 'blue.600' : 'gray.500'}
              _hover={{
                bg: activePane === 'library' ? 'blue.100' : 'gray.100',
              }}
              borderRadius="lg"
              width="44px"
              height="44px"
            >
              <AddIcon style={{ fontSize: '24px' }} />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>
              Add criteria
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>

        {/* AI Button */}
        <Tooltip.Root positioning={{ placement: 'right' }} openDelay={300}>
          <Tooltip.Trigger asChild>
            <IconButton
              aria-label="AI Suggestions"
              size="lg"
              variant="ghost"
              onClick={() => handleClick('ai')}
              bg={activePane === 'ai' ? 'blue.100' : 'transparent'}
              color={activePane === 'ai' ? 'blue.600' : 'gray.500'}
              _hover={{
                bg: activePane === 'ai' ? 'blue.100' : 'gray.100',
              }}
              borderRadius="lg"
              width="44px"
              height="44px"
            >
              <AutoAwesomeIcon style={{ fontSize: '24px' }} />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>
              AI Suggestions
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </VStack>
    </Box>
  );
}
