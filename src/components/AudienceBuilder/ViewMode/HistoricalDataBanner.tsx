import { Box, Button, Flex, Text } from '@chakra-ui/react';
import InfoIcon from '@mui/icons-material/Info';

interface HistoricalDataBannerProps {
  onLoadClick: () => void;
}

export const HistoricalDataBanner = ({ onLoadClick }: HistoricalDataBannerProps) => {
  return (
    <Box
      bg="blue.50"
      border="1px solid"
      borderColor="blue.200"
      borderRadius="lg"
      p={4}
      mb={6}
    >
      <Flex align="center" justify="space-between" gap={4}>
        <Flex align="center" gap={3} flex="1">
          <InfoIcon style={{ color: '#3182CE', fontSize: '20px' }} />
          <Text fontSize="sm" color="blue.900">
            Limited data shown. Load historical data to see full performance metrics.
          </Text>
        </Flex>
        <Button
          variant="outline"
          colorScheme="blue"
          size="sm"
          onClick={onLoadClick}
          flexShrink={0}
        >
          Load Historical Data
        </Button>
      </Flex>
    </Box>
  );
};
