import { VStack, IconButton } from '@chakra-ui/react';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HistoryIcon from '@mui/icons-material/History';

export type ToolbarPane = 'library' | 'agent' | 'comments' | 'activity' | null;

interface ToolbarProps {
  activePane: ToolbarPane;
  onPaneChange: (pane: ToolbarPane) => void;
}

export const Toolbar = ({ activePane, onPaneChange }: ToolbarProps) => {
  const handlePaneClick = (pane: ToolbarPane) => {
    // Toggle: if clicking active pane, close it
    onPaneChange(activePane === pane ? null : pane);
  };

  return (
    <VStack
      width="60px"
      height="100%"
      pt="24px"
      pb="12px"
      px="12px"
      gap="8px"
      flexShrink={0}
    >
      <IconButton
        aria-label="Add property"
        size="md"
        variant={activePane === 'library' ? 'solid' : 'ghost'}
        colorScheme={activePane === 'library' ? 'purple' : 'gray'}
        onClick={() => handlePaneClick('library')}
      >
        <MenuBookIcon fontSize="small" />
      </IconButton>

      <IconButton
        aria-label="Audience Agent"
        size="md"
        variant={activePane === 'agent' ? 'solid' : 'ghost'}
        colorScheme={activePane === 'agent' ? 'purple' : 'gray'}
        onClick={() => handlePaneClick('agent')}
      >
        <AutoAwesomeIcon fontSize="small" />
      </IconButton>

      <IconButton
        aria-label="Comments"
        size="md"
        variant={activePane === 'comments' ? 'solid' : 'ghost'}
        colorScheme={activePane === 'comments' ? 'purple' : 'gray'}
        onClick={() => handlePaneClick('comments')}
      >
        <ChatBubbleOutlineIcon fontSize="small" />
      </IconButton>

      <IconButton
        aria-label="Activity Log"
        size="md"
        variant={activePane === 'activity' ? 'solid' : 'ghost'}
        colorScheme={activePane === 'activity' ? 'purple' : 'gray'}
        onClick={() => handlePaneClick('activity')}
      >
        <HistoryIcon fontSize="small" />
      </IconButton>
    </VStack>
  );
};
