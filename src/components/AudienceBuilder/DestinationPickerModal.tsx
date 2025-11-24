import { Box, Button, Input, Text, Flex, Badge, VStack } from '@chakra-ui/react'
import { Dialog } from '@chakra-ui/react'
import SearchIcon from '@mui/icons-material/Search'
import { useState, useMemo } from 'react'
import type { Destination, PlatformType } from '../../types/destination'
import { availableDestinations, getPlatformMeta, formatLastSync } from '../../data/destinationMocks'

interface DestinationPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (destination: Destination) => void
  excludeIds?: string[] // Already added destination IDs to exclude
}

const PLATFORM_FILTERS: Array<{ value: PlatformType | 'all'; label: string }> = [
  { value: 'all', label: 'All platforms' },
  { value: 'google-ads', label: 'Google Ads' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'braze', label: 'Braze' },
  { value: 'mailchimp', label: 'Mailchimp' },
  { value: 'tiktok', label: 'TikTok' },
]

export function DestinationPickerModal({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
}: DestinationPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | 'all'>('all')

  // Filter destinations
  const filteredDestinations = useMemo(() => {
    return availableDestinations.filter((dest) => {
      // Exclude already added destinations
      if (excludeIds.includes(dest.id)) return false

      // Filter by platform
      if (selectedPlatform !== 'all' && dest.platformType !== selectedPlatform) {
        return false
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          dest.accountName.toLowerCase().includes(query) ||
          dest.listName?.toLowerCase().includes(query) ||
          dest.platformName.toLowerCase().includes(query) ||
          dest.accountId.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [searchQuery, selectedPlatform, excludeIds])

  const handleSelect = (destination: Destination) => {
    onSelect(destination)
    onClose()
    // Reset filters
    setSearchQuery('')
    setSelectedPlatform('all')
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop bg="blackAlpha.600" />
      <Dialog.Positioner>
        <Dialog.Content maxW="600px" maxH="80vh">
          <Dialog.Header>
            <Dialog.Title>Add Destination</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <VStack align="stretch" gap={4}>
              {/* Search input */}
              <Box position="relative">
                <Input
                  placeholder="Search destinations, accounts, or lists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  pl="40px"
                  size="md"
                />
                <Box
                  position="absolute"
                  left="12px"
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.400"
                  pointerEvents="none"
                >
                  <SearchIcon fontSize="small" />
                </Box>
              </Box>

              {/* Platform filters */}
              <Flex gap={2} flexWrap="wrap">
                {PLATFORM_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={selectedPlatform === filter.value ? 'solid' : 'outline'}
                    colorScheme={selectedPlatform === filter.value ? 'blue' : 'gray'}
                    onClick={() => setSelectedPlatform(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </Flex>

              {/* Destination list */}
              <Box maxH="400px" overflowY="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
                {filteredDestinations.length === 0 ? (
                  <Box p={6} textAlign="center">
                    <Text color="gray.500">
                      {excludeIds.length === availableDestinations.length
                        ? 'All destinations have been added'
                        : 'No destinations found'}
                    </Text>
                  </Box>
                ) : (
                  <VStack align="stretch" gap={0}>
                    {filteredDestinations.map((destination) => {
                      const platformMeta = getPlatformMeta(destination.platformType)

                      return (
                        <Flex
                          key={destination.id}
                          p={3}
                          borderBottom="1px solid"
                          borderColor="gray.100"
                          _last={{ borderBottom: 'none' }}
                          _hover={{ bg: 'gray.50' }}
                          transition="background 0.2s"
                          align="center"
                          gap={3}
                        >
                          {/* Platform badge */}
                          <Box flex="0 0 auto">
                            <Badge
                              px={2}
                              py={1}
                              borderRadius="md"
                              fontSize="xs"
                              fontWeight="medium"
                              color={platformMeta.color}
                              bg={platformMeta.bgColor}
                            >
                              {platformMeta.displayName}
                            </Badge>
                          </Box>

                          {/* Account info */}
                          <Box flex="1" minW="0">
                            <Text fontSize="sm" fontWeight="medium" color="gray.700" lineClamp={1}>
                              {destination.accountName}
                            </Text>
                            <Text fontSize="xs" color="gray.500" lineClamp={1}>
                              {destination.listName || destination.accountId}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              Last used: {formatLastSync(destination.lastSyncAt)}
                            </Text>
                          </Box>

                          {/* Select button */}
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleSelect(destination)}
                          >
                            Select
                          </Button>
                        </Flex>
                      )
                    })}
                  </VStack>
                )}
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
