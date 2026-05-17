import { Box, Button, Flex, Heading, Table, Badge, Text } from '@chakra-ui/react'
import AddIcon from '@mui/icons-material/Add'
import CircleIcon from '@mui/icons-material/Circle'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAudiences, initializeWithMockData, type SavedAudience, type SyncStatus } from '@/services/audienceStorage'

// Format large numbers with K suffix
function formatNumber(num: number | undefined): string {
  if (num === undefined) return '-'
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Get sync status color
function getSyncStatusColor(status: SyncStatus | undefined, hasDestinations: boolean): string {
  if (!hasDestinations) return 'gray.400'
  switch (status) {
    case 'healthy': return 'green.500'
    case 'warning': return 'purple.600'
    case 'error': return 'red.500'
    case 'inactive': return 'gray.400'
    default: return 'gray.400'
  }
}

function AudienceListPage() {
  const navigate = useNavigate()
  const [audiences, setAudiences] = useState<SavedAudience[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAudiences() {
      await initializeWithMockData()
      const loaded = getAudiences()
      // Sort by modifiedAt descending (most recent first)
      loaded.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
      setAudiences(loaded)
      setIsLoading(false)
    }
    loadAudiences()
  }, [])

  const handleRowClick = (audience: SavedAudience) => {
    navigate(`/audience/${audience.id}`)
  }

  return (
    <Box p={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading size="lg">Audiences</Heading>
        <Button
          colorScheme="purple"
          onClick={() => navigate('/audience/new')}
        >
          <AddIcon fontSize="small" style={{ marginRight: '8px' }} />
          Create New Audience
        </Button>
      </Flex>

      {isLoading ? (
        <Text color="gray.500">Loading audiences...</Text>
      ) : audiences.length === 0 ? (
        <Text color="gray.500">No audiences yet. Create your first audience to get started.</Text>
      ) : (
        <Box borderRadius="lg" border="1px solid" borderColor="gray.200" overflow="hidden">
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
                const hasDestinations = (audience.syncDestinations?.length ?? 0) > 0
                return (
                  <Table.Row
                    key={audience.id}
                    _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                    onClick={() => handleRowClick(audience)}
                  >
                    <Table.Cell py={3} px={4}>
                      <Text fontWeight="medium" color="gray.800">{audience.name}</Text>
                    </Table.Cell>
                    <Table.Cell py={3} px={4}>
                      <Badge
                        colorPalette={audience.status === 'published' ? 'green' : 'gray'}
                        variant="subtle"
                        fontSize="xs"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                      >
                        {audience.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
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
                            .replace('green.500', '#38A169')
                            .replace('purple.600', '#6B46C1')
                            .replace('red.500', '#E53E3E')
                            .replace('gray.400', '#A0AEC0')
                        }}
                      />
                    </Table.Cell>
                    <Table.Cell py={3} px={4}>
                      <Text color="gray.600" fontSize="sm">
                        {formatDate(audience.modifiedAt)}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Box>
  )
}

export default AudienceListPage
