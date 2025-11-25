import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getAudiences, initializeWithMockData, type SavedAudience } from '../services/audienceStorage';

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
        setAudiences(loadedAudiences);
      })
      .catch((error) => {
        console.error('Failed to initialize mock data:', error);
        // Try to load existing audiences anyway
        setAudiences(getAudiences());
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
        {/* Table header */}
        <Flex
          px={4}
          py={3}
          borderBottom="1px solid"
          borderColor="gray.200"
          bg="gray.50"
        >
          <Text flex="1" fontSize="sm" fontWeight="semibold" color="gray.700">
            Name
          </Text>
          <Text width="120px" fontSize="sm" fontWeight="semibold" color="gray.700">
            Status
          </Text>
          <Text width="60px" fontSize="sm" fontWeight="semibold" color="gray.700">
            {/* Actions */}
          </Text>
        </Flex>

        {/* Table rows */}
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
          audiences.map((audience) => (
            <Flex
              key={audience.id}
              px={4}
              py={4}
              borderBottom="1px solid"
              borderColor="gray.100"
              cursor="pointer"
              _hover={{ bg: 'gray.50' }}
              transition="background 0.2s"
              onClick={() => handleRowClick(audience.id)}
              align="center"
            >
              {/* Name */}
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium">
                  {audience.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Modified {new Date(audience.modifiedAt).toLocaleDateString()}
                </Text>
              </Box>

              {/* Status */}
              <Box width="120px">
                <Box
                  display="inline-block"
                  px={2}
                  py={0.5}
                  bg={audience.status === 'published' ? 'green.100' : 'gray.100'}
                  color={audience.status === 'published' ? 'green.700' : 'gray.700'}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="medium"
                >
                  {audience.status === 'published' ? 'Published' : 'Draft'}
                </Box>
              </Box>

              {/* Actions */}
              <Box width="60px" display="flex" justifyContent="flex-end">
                <ChevronRightIcon fontSize="small" style={{ color: '#718096' }} />
              </Box>
            </Flex>
          ))
        )}
      </Box>
    </Box>
  );
}
