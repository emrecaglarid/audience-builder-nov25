import { Box, VStack, Text, Flex, Button } from '@chakra-ui/react';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { AddedDestination, PlatformType } from '@/types/destination';

interface SupermetricsIntegrationProps {
  destinations: AddedDestination[];
}

// Platforms that have Supermetrics connectors
const SUPERMETRICS_SUPPORTED_PLATFORMS: PlatformType[] = [
  'google-ads',
  'facebook',
  'tiktok',
];

export const SupermetricsIntegration = ({ destinations }: SupermetricsIntegrationProps) => {
  // Filter to only supported platforms
  const supportedDestinations = destinations.filter((dest) =>
    SUPERMETRICS_SUPPORTED_PLATFORMS.includes(dest.platformType)
  );

  if (supportedDestinations.length === 0) return null;

  const handleCreateDashboard = () => {
    // Mock: In production, this would create a Supermetrics dashboard
    console.log('Creating Supermetrics dashboard with destinations:', supportedDestinations);
    // window.open('https://supermetrics.com/dashboard/create', '_blank');
  };

  return (
    <Box
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      p={6}
    >
      <VStack align="stretch" gap={3}>
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="sm" color="gray.600">
              Track audience performance with Facebook Ads, Google Ads, and Braze campaign costs in Supermetrics.
            </Text>
          </Box>

          <Button
            colorScheme="purple"
            size="sm"
            onClick={handleCreateDashboard}
            flexShrink={0}
            ml={4}
          >
            Create dashboard
            <OpenInNewIcon fontSize="inherit" style={{ marginLeft: '6px', fontSize: '16px' }} />
          </Button>
        </Flex>

        {/* ROI Example */}
        <Box pt={2} borderTop="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.600" fontStyle="italic">
            Example: $5,000 ad spend → 2,450 conversions = $2.04 cost per conversion
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};
