import { Box, Flex, Text, IconButton } from '@chakra-ui/react'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'

interface OverviewPaneProps {
  count: number
}

function OverviewPane({ count }: OverviewPaneProps) {
  // Format large numbers (e.g., 1200, 1.2K, 1.2M)
  const formatCount = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <Box
      width="280px"
      height="calc(100vh - 64px)"
      borderLeftWidth="1px"
      borderColor="gray.200"
      bg="white"
      p={6}
    >
      <Flex direction="column" gap={2}>
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            Audience Size
          </Text>
          <IconButton
            aria-label="Expand"
            variant="ghost"
            size="sm"
          >
            <OpenInFullIcon fontSize="small" />
          </IconButton>
        </Flex>

        <Box textAlign="center" py={8}>
          <Text fontSize="6xl" fontWeight="bold" lineHeight="1">
            {formatCount(count)}
          </Text>
          <Text fontSize="sm" color="gray.600" mt={2}>
            profiles in audience
          </Text>
        </Box>
      </Flex>
    </Box>
  )
}

export default OverviewPane
