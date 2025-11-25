import { Box, Flex, IconButton, Text } from '@chakra-ui/react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

interface SuccessBannerProps {
  onDismiss: () => void;
}

export const SuccessBanner = ({ onDismiss }: SuccessBannerProps) => {
  return (
    <Box
      bg="green.50"
      border="1px solid"
      borderColor="green.200"
      borderRadius="lg"
      p={4}
      mb={6}
    >
      <Flex align="center" justify="space-between" gap={4}>
        <Flex align="center" gap={3} flex="1">
          <CheckCircleIcon style={{ color: '#38A169', fontSize: '20px' }} />
          <Text fontSize="sm" color="green.900" fontWeight="medium">
            Historical data loaded successfully!
          </Text>
        </Flex>
        <IconButton
          aria-label="Dismiss"
          size="sm"
          variant="ghost"
          colorScheme="green"
          onClick={onDismiss}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Flex>
    </Box>
  );
};
