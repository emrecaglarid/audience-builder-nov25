import { Box, Text, Table, Badge } from '@chakra-ui/react';
import { AddedDestination } from '@/types/destination';
import { getPlatformMeta } from '@/data/destinationMocks';

interface SyncActivationSectionProps {
  destinations: AddedDestination[];
  experimentMode: boolean;
  currentAudienceSize: number; // Total profiles in audience
}

export const SyncActivationSection = ({
  destinations,
  experimentMode,
  currentAudienceSize,
}: SyncActivationSectionProps) => {
  if (destinations.length === 0) return null;

  const getStatusBadge = (status: string, disabled?: boolean) => {
    if (disabled) {
      return <Badge colorScheme="gray" fontSize="xs">Paused</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge colorScheme="green" fontSize="xs">Active</Badge>;
      case 'syncing':
        return <Badge colorScheme="purple" fontSize="xs">Syncing</Badge>;
      case 'paused':
        return <Badge colorScheme="yellow" fontSize="xs">Paused</Badge>;
      case 'error':
        return <Badge colorScheme="red" fontSize="xs">Error</Badge>;
      default:
        return <Badge colorScheme="green" fontSize="xs">Active</Badge>;
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Calculate synced profiles based on traffic percentage in experiment mode
  const getSyncedProfileCount = (dest: AddedDestination) => {
    if (experimentMode && dest.trafficPercentage !== undefined) {
      return Math.floor((currentAudienceSize * dest.trafficPercentage) / 100);
    }
    return currentAudienceSize;
  };

  return (
    <Box>
      <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={4}>
        Sync & activation
      </Text>

      <Box
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.200"
        overflow="hidden"
      >
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader color="gray.600" fontSize="xs" fontWeight="semibold" py={3}>
                Platform
              </Table.ColumnHeader>
              <Table.ColumnHeader color="gray.600" fontSize="xs" fontWeight="semibold">
                Campaign/Audience
              </Table.ColumnHeader>
              <Table.ColumnHeader color="gray.600" fontSize="xs" fontWeight="semibold" textAlign="right">
                Profiles synced
              </Table.ColumnHeader>
              <Table.ColumnHeader color="gray.600" fontSize="xs" fontWeight="semibold">
                Last synced
              </Table.ColumnHeader>
              <Table.ColumnHeader color="gray.600" fontSize="xs" fontWeight="semibold">
                Status
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {destinations.map((dest) => {
              const platformMeta = getPlatformMeta(dest.platformType);
              const syncedProfiles = getSyncedProfileCount(dest);

              return (
                <Table.Row key={dest.id} _hover={{ bg: 'gray.50' }}>
                  <Table.Cell py={3}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.800">
                      {platformMeta.displayName}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" color="gray.700">
                      {dest.targetAudienceName || dest.accountName}
                    </Text>
                  </Table.Cell>
                  <Table.Cell textAlign="right">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                      {syncedProfiles.toLocaleString()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" color="gray.600">
                      {formatTimestamp(dest.lastSyncAt)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {getStatusBadge(dest.status, dest.disabled)}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>

        {/* Error messages displayed after table if any */}
        {destinations.some(d => d.status === 'error' && d.errorMessage) && (
          <Box borderTop="1px solid" borderColor="gray.200">
            {destinations.map((dest) => (
              dest.status === 'error' && dest.errorMessage ? (
                <Box key={`${dest.id}-error`} p={3} bg="red.50" borderBottom="1px solid" borderColor="red.100">
                  <Text fontSize="xs" color="red.700">
                    <Text as="span" fontWeight="semibold">{getPlatformMeta(dest.platformType).displayName}:</Text> {dest.errorMessage}
                  </Text>
                </Box>
              ) : null
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
