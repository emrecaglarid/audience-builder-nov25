import { Box, Button, Flex, Text } from '@chakra-ui/react';
import InfoIcon from '@mui/icons-material/Info';

interface HistoricalDataBannerProps {
  onLoadClick: () => void;
}

export const HistoricalDataBanner = ({ onLoadClick }: HistoricalDataBannerProps) => {
  return (
    <Box
      bg="gray.50"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      p={4}
      mb={6}
    >
      <Flex align="center" justify="space-between" gap={4}>
        <Flex align="center" gap={3} flex="1">
          <InfoIcon style={{ color: '#4A5568', fontSize: '20px' }} />
          <Text fontSize="sm" color="gray.800">
            No data available for audience yet. You can load historical data.
          </Text>
        </Flex>
        <Button
          variant="outline"
          colorScheme="gray"
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
