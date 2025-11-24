import { Box, Button, Flex, Heading } from '@chakra-ui/react'
import AddIcon from '@mui/icons-material/Add'
import { useNavigate } from 'react-router-dom'

function AudienceListPage() {
  const navigate = useNavigate()

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

      <Box>
        <p>List of saved audiences will appear here</p>
      </Box>
    </Box>
  )
}

export default AudienceListPage
