import { Box, Flex, Text, Spinner } from '@chakra-ui/react';
import type { AddedDestination } from '../../types/destination';

interface DestinationSimulationProps {
  matchingProfiles: number;
  destinations: AddedDestination[];
  experimentMode: boolean;
  isCalculating?: boolean;
}

const colors = ['blue.500', 'green.500', 'purple.500', 'orange.500', 'pink.500'];

export const DestinationSimulation = ({
  matchingProfiles,
  destinations,
  experimentMode,
  isCalculating = false,
}: DestinationSimulationProps) => {
  // Format large numbers (e.g., 1200, 1.2K, 1.2M)
  const formatCount = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Calculate audience count for each destination
  const calculateAudience = (destination: AddedDestination): number => {
    if (experimentMode && destination.trafficPercentage !== undefined) {
      return Math.round(matchingProfiles * (destination.trafficPercentage / 100));
    }
    return matchingProfiles; // All destinations get full audience in normal mode
  };

  return (
    <Box
      width="320px"
      height="fit-content"
      flexShrink={0}
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        pb={2}
        mb={2}
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Text fontSize="md" fontWeight="semibold" color="gray.700">
          Simulate
        </Text>
      </Flex>

      {/* Content - Metrics with dividers */}
      <Box>
        {/* Total audience - always show */}
        <Flex
          justify="space-between"
          align="center"
          py={2}
          borderBottom={destinations.length > 0 ? "1px solid" : "none"}
          borderColor="gray.200"
        >
          <Text fontSize="sm" color="gray.600">
            Total audience
          </Text>
          <Flex align="center" gap={2}>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color="gray.800"
              opacity={isCalculating ? 0.5 : 1}
              transition="opacity 0.2s"
            >
              {formatCount(matchingProfiles)}
            </Text>
            {isCalculating && (
              <Spinner size="sm" color="purple.500" />
            )}
          </Flex>
        </Flex>

        {/* Destinations section */}
        {destinations.length > 0 && (
          <Box pt={3}>
            <Text fontSize="xs" fontWeight="medium" color="gray.600" mb={2}>
              Destinations
            </Text>
            <Box>
              {destinations.map((destination, index) => {
                const audienceCount = calculateAudience(destination);
                const color = colors[index % colors.length];

                return (
                  <Flex
                    key={destination.id}
                    justify="space-between"
                    align="center"
                    py={2}
                    borderBottom={index < destinations.length - 1 ? "1px solid" : "none"}
                    borderColor="gray.100"
                  >
                    <Flex align="center" gap={2} flex="1">
                      {/* Color indicator */}
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg={color}
                        flexShrink={0}
                      />
                      <Box flex="1">
                        <Text fontSize="sm" color="gray.700" fontWeight="medium" lineClamp={1}>
                          {destination.accountName}
                        </Text>
                        {experimentMode && destination.trafficPercentage !== undefined && (
                          <Text fontSize="xs" color="gray.500">
                            {destination.trafficPercentage}%
                          </Text>
                        )}
                        {!experimentMode && (
                          <Text fontSize="xs" color="gray.500">
                            100%
                          </Text>
                        )}
                      </Box>
                    </Flex>
                    <Text
                      fontSize="lg"
                      fontWeight="semibold"
                      color="gray.800"
                      opacity={isCalculating ? 0.5 : 1}
                      transition="opacity 0.2s"
                    >
                      {formatCount(audienceCount)}
                    </Text>
                  </Flex>
                );
              })}
            </Box>
          </Box>
        )}

        {/* No destinations message */}
        {destinations.length === 0 && (
          <Box pt={3}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              No audience is being synced
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DestinationSimulation;
