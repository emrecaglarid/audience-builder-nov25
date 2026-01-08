import { Box, Text, VStack, Flex, Input, IconButton, Badge } from '@chakra-ui/react'
import { Tooltip } from '@chakra-ui/react'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useState, useMemo, useEffect, useRef } from 'react'
import { FactDefinition, EngagementDefinition, PropertyDefinition, PropertyReference } from '@/types'
import { detectInputMode } from './aiSuggestions'

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
  activeSectionId?: string
  activeSectionName?: string
  isEngagementsOnly?: boolean
  onItemClick: (item: FactDefinition | EngagementDefinition, type: 'fact' | 'engagement') => void
  onPropertyClick: (propertyRef: PropertyReference) => void
  onSwitchToAI?: (query: string) => void
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
  propertyRef: _propertyRef,
  propertyKey,
  hoveredProperty,
  activeSectionName,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: DraggablePropertyItemProps) {
  const isHovered = hoveredProperty === propertyKey

  return (
    <Flex
      align="center"
      justify="space-between"
      px={4}
      py={2}
      cursor="pointer"
      _hover={{ bg: 'blue.50' }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      transition="opacity 0.2s"
    >
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

function LibraryPane({ facts, engagements, isVisible, activeSectionId: _activeSectionId, activeSectionName = 'section', isEngagementsOnly = false, onPropertyClick, onSwitchToAI }: LibraryPaneProps) {
  if (!isVisible) return null

  const [searchQuery, setSearchQuery] = useState('')
  const [navigationView, setNavigationView] = useState<NavigationView>({ type: 'main' })
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)
  const [factsExpanded, setFactsExpanded] = useState(!isEngagementsOnly)
  const [engagementsExpanded, setEngagementsExpanded] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Collapse/expand facts section when switching between tabs
  useEffect(() => {
    if (isEngagementsOnly) {
      setFactsExpanded(false)
    } else {
      setFactsExpanded(true)
    }
  }, [isEngagementsOnly])

  // Handle search input with AI detection
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    // Detect if user is typing natural language (AI mode)
    if (value.trim() && onSwitchToAI) {
      const mode = detectInputMode(value)
      if (mode === 'ai') {
        // Switch to AI pane with the query
        onSwitchToAI(value)
        setSearchQuery('')
      }
    }
  }

  // Filter facts/engagements based on isEngagementsOnly and search
  const availableFacts = isEngagementsOnly ? [] : facts

  // Build flat list of all searchable properties
  const allProperties = useMemo(() => {
    const props: Array<{property: PropertyDefinition, type: 'fact' | 'engagement', parentId: string, parentName: string}> = []
    if (!isEngagementsOnly) {
      facts.forEach(f => f.properties.forEach(p => props.push({property: p, type: 'fact', parentId: f.id, parentName: f.name})))
    }
    engagements.forEach(e => e.properties.forEach(p => props.push({property: p, type: 'engagement', parentId: e.id, parentName: e.name})))
    return props
  }, [facts, engagements, isEngagementsOnly])

  // Search results - flat list of matching properties
  const searchResults = useMemo(() => {
    if (!searchQuery) return []
    const query = searchQuery.toLowerCase()
    return allProperties.filter(item =>
      item.property.name.toLowerCase().includes(query) ||
      item.property.description.toLowerCase().includes(query)
    )
  }, [allProperties, searchQuery])

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults.length])

  // Filter facts/engagements for main view
  const filteredFacts = useMemo(() => {
    if (isEngagementsOnly) return []
    if (!searchQuery) return availableFacts

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

  // Handle clicking a search result
  const handleSearchResultClick = (item: typeof searchResults[0]) => {
    const propertyRef: PropertyReference = {
      type: item.type,
      parentId: item.parentId,
      parentName: item.parentName,
      property: item.property
    }
    onPropertyClick(propertyRef)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) {
      if (e.key === 'Escape') {
        setSearchQuery('')
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (searchResults[selectedIndex]) {
          handleSearchResultClick(searchResults[selectedIndex])
        }
        break
      case 'Escape':
        setSearchQuery('')
        break
    }
  }

  return (
    <Box
      width="320px"
      height="100%"
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      flexShrink={0}
    >
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        {navigationView.type === 'main' ? (
          <Text fontWeight="semibold" fontSize="md">
            Library
          </Text>
        ) : (
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
            ref={searchInputRef}
            placeholder="Search properties"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="sm"
            paddingLeft="36px"
            paddingRight={searchQuery ? '36px' : '12px'}
            onKeyDown={handleKeyDown}
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
        {/* Search Results View */}
        {searchQuery && searchResults.length > 0 ? (
          <VStack align="stretch" gap={0}>
            {searchResults.map((item, index) => {
              const isSelected = index === selectedIndex
              return (
                <Flex
                  key={`${item.parentId}-${item.property.id}`}
                  align="center"
                  justify="space-between"
                  px={4}
                  py={2}
                  cursor="pointer"
                  bg={isSelected ? 'blue.50' : 'transparent'}
                  _hover={{ bg: isSelected ? 'blue.50' : 'gray.50' }}
                  onClick={() => handleSearchResultClick(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium">{item.property.name}</Text>
                    <Text fontSize="xs" color="gray.500">from {item.parentName}</Text>
                  </Box>
                  <Box
                    opacity={isSelected ? 1 : 0}
                    transition="opacity 0.2s"
                    display="flex"
                    alignItems="center"
                  >
                    <AddIcon fontSize="small" style={{ fontSize: '16px', color: '#3182CE' }} />
                  </Box>
                </Flex>
              )
            })}
          </VStack>
        ) : searchQuery && searchResults.length === 0 ? (
          <Box px={4} py={2}>
            <Flex
              align="center"
              px={3}
              py={2}
              cursor="pointer"
              bg="purple.50"
              borderRadius="md"
              _hover={{ bg: 'purple.100' }}
              onClick={() => onSwitchToAI && onSwitchToAI(searchQuery)}
            >
              <AutoAwesomeIcon fontSize="small" style={{ color: '#805AD5', marginRight: '8px' }} />
              <Text fontSize="sm" color="purple.700">
                Build with AI: '{searchQuery}'
              </Text>
            </Flex>
          </Box>
        ) : navigationView.type === 'main' ? (
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

            {/* Divider */}
            <Box borderTop="1px solid" borderColor="gray.100" my={2} />

            {/* Engagements Section */}
            <Box>
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
