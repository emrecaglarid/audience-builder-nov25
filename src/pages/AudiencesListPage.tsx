import { Box, Flex, Text, Button, Table } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CircleIcon from '@mui/icons-material/Circle';
import { getAudiences, initializeWithMockData, type SavedAudience, type SyncStatus } from '../services/audienceStorage';

// Format large numbers with K suffix
function formatNumber(num: number | undefined): string {
  if (num === undefined) return '-';
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get sync status color
function getSyncStatusColor(status: SyncStatus | undefined, hasDestinations: boolean): string {
  if (!hasDestinations) return '#A0AEC0'; // gray
  switch (status) {
    case 'healthy': return '#38A169'; // green
    case 'warning': return '#D69E2E'; // yellow
    case 'error': return '#E53E3E'; // red
    case 'inactive': return '#A0AEC0'; // gray
    default: return '#A0AEC0'; // gray
  }
}

export function AudiencesListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [audiences, setAudiences] = useState<SavedAudience[]>([]);

  useEffect(() => {
    // Initialize with mock data on first load if empty
    initializeWithMockData()
      .then(() => {
        const loadedAudiences = getAudiences();
        console.log('Loaded audiences:', loadedAudiences.length);
        // Sort by modifiedAt descending (most recent first)
        loadedAudiences.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
        setAudiences(loadedAudiences);
      })
      .catch((error) => {
        console.error('Failed to initialize mock data:', error);
        // Try to load existing audiences anyway
        const fallback = getAudiences();
        fallback.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
        setAudiences(fallback);
      });
  }, [location.pathname]); // Re-run when pathname changes (e.g., back navigation)

  const handleRowClick = (id: string) => {
    navigate(`/audiences/${id}`);
  };

  const handleNewAudience = () => {
    navigate('/audiences/new');
  };

  return (
    <Box p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Audiences
        </Text>
        <Button
          colorScheme="purple"
          onClick={handleNewAudience}
        >
          <AddIcon fontSize="small" style={{ marginRight: '8px' }} />
          New audience
        </Button>
      </Flex>

      {/* Table */}
      <Box
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.200"
        overflow="hidden"
      >
        {audiences.length === 0 ? (
          <Box py={12} textAlign="center">
            <Text color="gray.500" mb={4}>
              No audiences yet
            </Text>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewAudience}
            >
              Create your first audience
            </Button>
          </Box>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader py={3} px={4} fontWeight="semibold" color="gray.600">Name</Table.ColumnHeader>
                <Table.ColumnHeader py={3} px={4} fontWeight="semibold" color="gray.600">Status</Table.ColumnHeader>
                <Table.ColumnHeader py={3} px={4} fontWeight="semibold" color="gray.600" textAlign="right">Entered</Table.ColumnHeader>
                <Table.ColumnHeader py={3} px={4} fontWeight="semibold" color="gray.600" textAlign="right">Active</Table.ColumnHeader>
                <Table.ColumnHeader py={3} px={4} fontWeight="semibold" color="gray.600" textAlign="right">Exited</Table.ColumnHeader>
                <Table.ColumnHeader py={3} px={4} fontWeight="semibold" color="gray.600" textAlign="right">Met Goals</Table.ColumnHeader>
                <Table.ColumnHeader py={3} px={4} fontWeight="semibold" color="gray.600" textAlign="center">Sync</Table.ColumnHeader>
                <Table.ColumnHeader py={3} px={4} fontWeight="semibold" color="gray.600">Last Modified</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {audiences.map((audience) => {
                const hasDestinations = (audience.syncDestinations?.length ?? 0) > 0;
                return (
                  <Table.Row
                    key={audience.id}
                    _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                    onClick={() => handleRowClick(audience.id)}
                  >
                    <Table.Cell py={3} px={4}>
                      <Text fontWeight="medium" color="gray.800">{audience.name}</Text>
                    </Table.Cell>
                    <Table.Cell py={3} px={4}>
                      <Box
                        display="inline-block"
                        px={2}
                        py={0.5}
                        bg={audience.status === 'published' ? 'green.100' : 'gray.100'}
                        color={audience.status === 'published' ? 'green.700' : 'gray.700'}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="medium"
                      >
                        {audience.status === 'published' ? 'Published' : 'Draft'}
                      </Box>
                    </Table.Cell>
                    <Table.Cell py={3} px={4} textAlign="right">
                      <Text color={audience.metrics?.entered ? 'gray.800' : 'gray.400'}>
                        {formatNumber(audience.metrics?.entered)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py={3} px={4} textAlign="right">
                      <Text color={audience.metrics?.active ? 'gray.800' : 'gray.400'}>
                        {formatNumber(audience.metrics?.active)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py={3} px={4} textAlign="right">
                      <Text color={audience.metrics?.exited ? 'gray.800' : 'gray.400'}>
                        {formatNumber(audience.metrics?.exited)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py={3} px={4} textAlign="right">
                      <Text color={audience.metrics?.metGoals ? 'gray.800' : 'gray.400'}>
                        {formatNumber(audience.metrics?.metGoals)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell py={3} px={4} textAlign="center">
                      <CircleIcon
                        style={{
                          fontSize: '10px',
                          color: getSyncStatusColor(audience.syncStatus, hasDestinations)
                        }}
                      />
                    </Table.Cell>
                    <Table.Cell py={3} px={4}>
                      <Text color="gray.600" fontSize="sm">
                        {formatDate(audience.modifiedAt)}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        )}
      </Box>
    </Box>
  );
}
