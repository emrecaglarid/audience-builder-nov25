import { Box, Text, VStack, Flex, Input, IconButton, Badge } from '@chakra-ui/react'
import { Tooltip } from '@chakra-ui/react'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { useState, useMemo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { FactDefinition, EngagementDefinition, PropertyDefinition, PropertyReference } from '@/types'

// Map section titles to concise tooltip text
function getSectionTooltipText(sectionTitle: string): string {
  const tooltipMap: Record<string, string> = {
    'Enter audience if': 'entry criteria',
    'Exit audience if': 'exit criteria',
    'Goals': 'goals',
    'Sync and activation': 'sync and activation',
  }

  return tooltipMap[sectionTitle] || sectionTitle.toLowerCase()
}

interface LibraryPaneProps {
  facts: FactDefinition[]
  engagements: EngagementDefinition[]
  recentlyUsed: PropertyReference[]
  isVisible: boolean
  activeSectionName?: string
  onItemClick: (item: FactDefinition | EngagementDefinition, type: 'fact' | 'engagement') => void
  onPropertyClick: (propertyRef: PropertyReference) => void
  onClose: () => void
}

type NavigationView =
  | { type: 'main' }
  | { type: 'fact-detail', fact: FactDefinition }
  | { type: 'engagement-detail', engagement: EngagementDefinition }

// Draggable property item component
interface DraggablePropertyItemProps {
  property: PropertyDefinition
  propertyRef: PropertyReference
  propertyKey: string
  hoveredProperty: string | null
  activeSectionName: string
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
}

function DraggablePropertyItem({
  property,
  propertyRef,
  propertyKey,
  hoveredProperty,
  activeSectionName,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: DraggablePropertyItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: propertyKey,
    data: {
      ...propertyRef,
      dragType: 'property', // Use dragType to avoid overwriting propertyRef.type
    },
  })

  const isHovered = hoveredProperty === propertyKey

  return (
    <Flex
      ref={setNodeRef}
      align="center"
      justify="space-between"
      px={4}
      py={2}
      cursor="pointer"
      _hover={{ bg: 'blue.50' }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      opacity={isDragging ? 0.5 : 1}
      transition="opacity 0.2s"
    >
      {/* Drag handle - visible on hover */}
      <Box
        opacity={isHovered ? 1 : 0}
        transition="opacity 0.2s"
        mr={2}
        display="flex"
        alignItems="center"
        color="gray.400"
        cursor={isDragging ? 'grabbing' : 'grab'}
        {...listeners}
        {...attributes}
      >
        <DragIndicatorIcon fontSize="small" style={{ fontSize: '16px' }} />
      </Box>

      <Box flex={1}>
        <Text fontSize="sm">{property.name}</Text>
        {property.description && (
          <Text fontSize="xs" color="gray.500" lineClamp={1}>
            {property.description}
          </Text>
        )}
      </Box>

      {/* Add button with tooltip */}
      <Tooltip.Root positioning={{ placement: 'left' }}>
        <Tooltip.Trigger asChild>
          <Box
            opacity={isHovered ? 1 : 0}
            transition="opacity 0.2s"
            display="flex"
            alignItems="center"
          >
            <AddIcon fontSize="small" style={{ fontSize: '16px', color: '#3182CE' }} />
          </Box>
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>
            Add to {getSectionTooltipText(activeSectionName)}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Root>
    </Flex>
  )
}

function LibraryPane({ facts, engagements, isVisible, activeSectionName = 'section', onPropertyClick, onClose }: LibraryPaneProps) {
  if (!isVisible) return null

  const [searchQuery, setSearchQuery] = useState('')
  const [navigationView, setNavigationView] = useState<NavigationView>({ type: 'main' })
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)
  const [factsExpanded, setFactsExpanded] = useState(false)
  const [engagementsExpanded, setEngagementsExpanded] = useState(false)

  // Filter facts/engagements for main view
  const filteredFacts = useMemo(() => {
    if (!searchQuery) return facts

    const query = searchQuery.toLowerCase()
    return facts.filter(fact => {
      const nameMatch = fact.name.toLowerCase().includes(query)
      const descMatch = fact.description.toLowerCase().includes(query)
      const propMatch = fact.properties.some(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
      return nameMatch || descMatch || propMatch
    })
  }, [facts, searchQuery])

  const filteredEngagements = useMemo(() => {
    if (!searchQuery) return engagements

    const query = searchQuery.toLowerCase()
    return engagements.filter(eng => {
      const nameMatch = eng.name.toLowerCase().includes(query)
      const descMatch = eng.description.toLowerCase().includes(query)
      const propMatch = eng.properties.some(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
      return nameMatch || descMatch || propMatch
    })
  }, [engagements, searchQuery])

  // Filter properties for detail view
  const filteredProperties = useMemo(() => {
    if (navigationView.type === 'fact-detail') {
      if (!searchQuery) return navigationView.fact.properties
      const query = searchQuery.toLowerCase()
      return navigationView.fact.properties.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    } else if (navigationView.type === 'engagement-detail') {
      if (!searchQuery) return navigationView.engagement.properties
      const query = searchQuery.toLowerCase()
      return navigationView.engagement.properties.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    }
    return []
  }, [navigationView, searchQuery])

  const handleFactClick = (fact: FactDefinition) => {
    setNavigationView({ type: 'fact-detail', fact })
    setSearchQuery('') // Clear search when drilling down
  }

  const handleEngagementClick = (engagement: EngagementDefinition) => {
    setNavigationView({ type: 'engagement-detail', engagement })
    setSearchQuery('') // Clear search when drilling down
  }

  const handleBackClick = () => {
    setNavigationView({ type: 'main' })
    setSearchQuery('') // Clear search when going back
  }

  const handlePropertyClickInternal = (property: PropertyDefinition) => {
    if (navigationView.type === 'fact-detail') {
      const propertyRef: PropertyReference = {
        type: 'fact',
        parentId: navigationView.fact.id,
        parentName: navigationView.fact.name,
        property
      }
      onPropertyClick(propertyRef)
    } else if (navigationView.type === 'engagement-detail') {
      const propertyRef: PropertyReference = {
        type: 'engagement',
        parentId: navigationView.engagement.id,
        parentName: navigationView.engagement.name,
        property
      }
      onPropertyClick(propertyRef)
    }
  }

  return (
    <Box
      width="320px"
      height="calc(100vh - 60px - 48px)"
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      flexShrink={0}
    >
      {/* Header with title and close button */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        {navigationView.type === 'main' ? (
          <>
            <Text fontWeight="semibold" fontSize="md">
              Add property
            </Text>
            <IconButton
              aria-label="Close"
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <>
            <Flex align="center" gap={2} flex={1}>
              <IconButton
                aria-label="Back to library"
                size="sm"
                variant="ghost"
                onClick={handleBackClick}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Text fontWeight="semibold" fontSize="md" lineClamp={1}>
                {navigationView.type === 'fact-detail'
                  ? navigationView.fact.name
                  : navigationView.engagement.name}
              </Text>
            </Flex>
            <IconButton
              aria-label="Close library"
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Flex>

      {/* Search Bar */}
      <Box px={4} py={3}>
        <Box position="relative">
          <Box
            position="absolute"
            left="12px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            pointerEvents="none"
            display="flex"
            alignItems="center"
          >
            <SearchIcon fontSize="small" style={{ color: '#A0AEC0' }} />
          </Box>
          <Input
            placeholder={navigationView.type === 'main' ? 'Search properties...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
            paddingLeft="36px"
            paddingRight={searchQuery ? '36px' : '12px'}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('')
              }
            }}
          />
          {searchQuery && (
            <Box position="absolute" right="4px" top="50%" transform="translateY(-50%)" zIndex={1}>
              <IconButton
                aria-label="Clear search"
                size="xs"
                variant="ghost"
                onClick={() => setSearchQuery('')}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box flex={1} overflowY="auto">
        {navigationView.type === 'main' ? (
          <VStack align="stretch" gap={0}>
            {/* Facts Section */}
            <Box>
              <Flex
                align="center"
                justify="space-between"
                px={4}
                py={3}
                mb={factsExpanded ? 2 : 0}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => setFactsExpanded(!factsExpanded)}
              >
                <Flex align="center" gap={1}>
                  {factsExpanded ? (
                    <ExpandMoreIcon fontSize="small" />
                  ) : (
                    <ChevronRightIcon fontSize="small" />
                  )}
                  <Text fontWeight="semibold" fontSize="sm">
                    Facts
                  </Text>
                </Flex>
                <Badge colorScheme="gray" fontSize="xs">
                  {filteredFacts.length}
                </Badge>
              </Flex>

              {factsExpanded ? (
                <VStack align="stretch" gap={0}>
                  {filteredFacts.map((fact) => (
                    <Flex
                      key={fact.id}
                      align="center"
                      justify="space-between"
                      px={4}
                      py={3}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleFactClick(fact)}
                    >
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {fact.name}
                        </Text>
                        {fact.description && (
                          <Text fontSize="xs" color="gray.500" lineClamp={1}>
                            {fact.description}
                          </Text>
                        )}
                      </Box>
                      <ChevronRightIcon fontSize="small" style={{ color: '#A0AEC0' }} />
                    </Flex>
                  ))}
                </VStack>
              ) : null}
            </Box>

            {/* Engagements Section */}
            <Box mt={4}>
              <Flex
                align="center"
                justify="space-between"
                px={4}
                py={3}
                mb={engagementsExpanded ? 2 : 0}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => setEngagementsExpanded(!engagementsExpanded)}
              >
                <Flex align="center" gap={1}>
                  {engagementsExpanded ? (
                    <ExpandMoreIcon fontSize="small" />
                  ) : (
                    <ChevronRightIcon fontSize="small" />
                  )}
                  <Text fontWeight="semibold" fontSize="sm">
                    Engagements
                  </Text>
                </Flex>
                <Badge colorScheme="gray" fontSize="xs">
                  {filteredEngagements.length}
                </Badge>
              </Flex>

              {engagementsExpanded ? (
                <VStack align="stretch" gap={0}>
                  {filteredEngagements.map((engagement) => (
                    <Flex
                      key={engagement.id}
                      align="center"
                      justify="space-between"
                      px={4}
                      py={3}
                      cursor="pointer"
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleEngagementClick(engagement)}
                    >
                      <Box flex={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          {engagement.name}
                        </Text>
                        {engagement.description && (
                          <Text fontSize="xs" color="gray.500" lineClamp={1}>
                            {engagement.description}
                          </Text>
                        )}
                      </Box>
                      <ChevronRightIcon fontSize="small" style={{ color: '#A0AEC0' }} />
                    </Flex>
                  ))}
                </VStack>
              ) : null}
            </Box>
          </VStack>
        ) : (
          // Detail View - Property List
          <VStack align="stretch" gap={0}>
            {filteredProperties.map((property) => {
              const propertyKey = `${navigationView.type === 'fact-detail' ? navigationView.fact.id : navigationView.engagement.id}-${property.id}`

              const propertyRef: PropertyReference = navigationView.type === 'fact-detail'
                ? {
                    type: 'fact',
                    parentId: navigationView.fact.id,
                    parentName: navigationView.fact.name,
                    property
                  }
                : {
                    type: 'engagement',
                    parentId: navigationView.engagement.id,
                    parentName: navigationView.engagement.name,
                    property
                  }

              return (
                <DraggablePropertyItem
                  key={property.id}
                  property={property}
                  propertyRef={propertyRef}
                  propertyKey={propertyKey}
                  hoveredProperty={hoveredProperty}
                  activeSectionName={activeSectionName}
                  onMouseEnter={() => setHoveredProperty(propertyKey)}
                  onMouseLeave={() => setHoveredProperty(null)}
                  onClick={() => handlePropertyClickInternal(property)}
                />
              )
            })}
          </VStack>
        )}
      </Box>
    </Box>
  )
}

export default LibraryPane
