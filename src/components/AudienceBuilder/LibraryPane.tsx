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

// A search result row — either a plain property or a value-match (Property = value)
interface SearchResult {
  property: PropertyDefinition
  type: 'fact' | 'engagement'
  parentId: string
  parentName: string
  presetOperator?: string
  presetValue?: string
}

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
      _hover={{ bg: 'gray.50' }}
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

      <Tooltip.Root positioning={{ placement: 'left' }}>
        <Tooltip.Trigger asChild>
          <Box
            opacity={isHovered ? 1 : 0}
            transition="opacity 0.2s"
            display="flex"
            alignItems="center"
          >
            <AddIcon fontSize="small" style={{ fontSize: '16px', color: '#A0AEC0' }} />
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

function LibraryPane({
  facts,
  engagements,
  isVisible,
  activeSectionId: _activeSectionId,
  activeSectionName = 'section',
  isEngagementsOnly = false,
  onPropertyClick,
  onSwitchToAI,
}: LibraryPaneProps) {
  if (!isVisible) return null

  const [searchQuery, setSearchQuery] = useState('')
  const [navigationView, setNavigationView] = useState<NavigationView>({ type: 'main' })
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)
  const [factsExpanded, setFactsExpanded] = useState(!isEngagementsOnly)
  const [engagementsExpanded, setEngagementsExpanded] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isAIMode, setIsAIMode] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isEngagementsOnly) {
      setFactsExpanded(false)
    } else {
      setFactsExpanded(true)
    }
  }, [isEngagementsOnly])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    // Clear existing debounce
    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current)

    if (!value.trim()) {
      setIsAIMode(false)
      return
    }

    // Debounce AI detection by 300ms so fast typing doesn't flicker
    aiDebounceRef.current = setTimeout(() => {
      const mode = detectInputMode(value)
      setIsAIMode(mode === 'ai')
    }, 300)
  }

  // Build flat list of all searchable properties
  const allProperties = useMemo(() => {
    const props: SearchResult[] = []
    if (!isEngagementsOnly) {
      facts.forEach(f => f.properties.forEach(p => props.push({ property: p, type: 'fact', parentId: f.id, parentName: f.name })))
    }
    engagements.forEach(e => e.properties.forEach(p => props.push({ property: p, type: 'engagement', parentId: e.id, parentName: e.name })))
    return props
  }, [facts, engagements, isEngagementsOnly])

  // Search results — includes both name/description matches and allowedValue matches
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery) return []
    const query = searchQuery.toLowerCase()
    const seen = new Set<string>()
    const results: SearchResult[] = []

    for (const item of allProperties) {
      const nameMatch = item.property.name.toLowerCase().includes(query)
      const descMatch = item.property.description.toLowerCase().includes(query)

      if (nameMatch || descMatch) {
        const key = `${item.parentId}-${item.property.id}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push(item)
        }
      }

      // Value-based matching: search through allowedValues
      if (item.property.allowedValues && item.property.dataType === 'string') {
        for (const val of item.property.allowedValues as string[]) {
          if (val.toLowerCase().includes(query)) {
            const key = `${item.parentId}-${item.property.id}-${val}`
            if (!seen.has(key)) {
              seen.add(key)
              results.push({
                ...item,
                presetOperator: 'equals',
                presetValue: val,
              })
            }
          }
        }
      }
    }

    return results.slice(0, 10)
  }, [allProperties, searchQuery])

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchResults.length])

  const filteredFacts = useMemo(() => {
    if (isEngagementsOnly) return []
    if (!searchQuery) return facts
    const query = searchQuery.toLowerCase()
    return facts.filter(fact =>
      fact.name.toLowerCase().includes(query) ||
      fact.description.toLowerCase().includes(query) ||
      fact.properties.some(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
    )
  }, [facts, searchQuery, isEngagementsOnly])

  const filteredEngagements = useMemo(() => {
    if (!searchQuery) return engagements
    const query = searchQuery.toLowerCase()
    return engagements.filter(eng =>
      eng.name.toLowerCase().includes(query) ||
      eng.description.toLowerCase().includes(query) ||
      eng.properties.some(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
    )
  }, [engagements, searchQuery])

  const filteredProperties = useMemo(() => {
    if (navigationView.type === 'fact-detail') {
      if (!searchQuery) return navigationView.fact.properties
      const query = searchQuery.toLowerCase()
      return navigationView.fact.properties.filter(p =>
        p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      )
    } else if (navigationView.type === 'engagement-detail') {
      if (!searchQuery) return navigationView.engagement.properties
      const query = searchQuery.toLowerCase()
      return navigationView.engagement.properties.filter(p =>
        p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
      )
    }
    return []
  }, [navigationView, searchQuery])

  const handleFactClick = (fact: FactDefinition) => {
    setNavigationView({ type: 'fact-detail', fact })
    setSearchQuery('')
  }

  const handleEngagementClick = (engagement: EngagementDefinition) => {
    setNavigationView({ type: 'engagement-detail', engagement })
    setSearchQuery('')
  }

  const handleBackClick = () => {
    setNavigationView({ type: 'main' })
    setSearchQuery('')
  }

  const handlePropertyClickInternal = (property: PropertyDefinition) => {
    if (navigationView.type === 'fact-detail') {
      onPropertyClick({ type: 'fact', parentId: navigationView.fact.id, parentName: navigationView.fact.name, property })
    } else if (navigationView.type === 'engagement-detail') {
      onPropertyClick({ type: 'engagement', parentId: navigationView.engagement.id, parentName: navigationView.engagement.name, property })
    }
  }

  const handleSearchResultClick = (item: SearchResult) => {
    const propertyRef: PropertyReference = {
      type: item.type,
      parentId: item.parentId,
      parentName: item.parentName,
      property: item.property,
      presetOperator: item.presetOperator,
      presetValue: item.presetValue,
    }
    onPropertyClick(propertyRef)
    setSearchQuery('')
    setIsAIMode(false)
  }

  const triggerAI = () => {
    if (onSwitchToAI && searchQuery.trim()) {
      onSwitchToAI(searchQuery)
      setSearchQuery('')
      setIsAIMode(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('')
      setIsAIMode(false)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      // If in AI mode (no property matches and input looks like a prompt), switch to AI
      if (isAIMode && searchResults.length === 0) {
        triggerAI()
        return
      }
      if (searchResults[selectedIndex]) {
        handleSearchResultClick(searchResults[selectedIndex])
      }
      return
    }

    if (searchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    }
  }

  const hasResults = searchQuery && searchResults.length > 0
  const noResults = searchQuery && searchResults.length === 0

  // Input visual state when typed text looks like an AI prompt
  const inputBorderColor = isAIMode ? 'purple.400' : undefined
  const inputBg = isAIMode ? 'purple.50' : undefined

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
          <Text fontWeight="semibold" fontSize="md">Library</Text>
        ) : (
          <Flex align="center" gap={2} flex={1}>
            <IconButton aria-label="Back to library" size="sm" variant="ghost" onClick={handleBackClick}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Text fontWeight="semibold" fontSize="md" lineClamp={1}>
              {navigationView.type === 'fact-detail' ? navigationView.fact.name : navigationView.engagement.name}
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Search Bar */}
      <Box px={4} py={3}>
        <Box position="relative">
          {/* Left icon: sparkle when AI-like, magnifier otherwise */}
          <Box
            position="absolute"
            left="12px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            pointerEvents="none"
            display="flex"
            alignItems="center"
            transition="all 0.2s"
          >
            {isAIMode ? (
              <AutoAwesomeIcon fontSize="small" style={{ color: '#805AD5', fontSize: '16px' }} />
            ) : (
              <SearchIcon fontSize="small" style={{ color: '#A0AEC0' }} />
            )}
          </Box>
          <Input
            ref={searchInputRef}
            placeholder={isAIMode ? 'Describe your audience…' : 'Search properties'}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="sm"
            paddingLeft="36px"
            paddingRight={searchQuery ? '36px' : '12px'}
            onKeyDown={handleKeyDown}
            borderColor={inputBorderColor}
            bg={inputBg}
            _focus={isAIMode
              ? { borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }
              : undefined
            }
            transition="all 0.2s"
          />
          {searchQuery && (
            <Box position="absolute" right="4px" top="50%" transform="translateY(-50%)" zIndex={1}>
              <IconButton
                aria-label="Clear search"
                size="xs"
                variant="ghost"
                onClick={() => { setSearchQuery(''); setIsAIMode(false); }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* AI mode hint — only when input looks like a prompt but there are no property matches */}
        {isAIMode && noResults && (
          <Text fontSize="xs" color="purple.600" mt={1}>
            Press Enter to build with AI
          </Text>
        )}
      </Box>

      {/* Scrollable Content */}
      <Box flex={1} overflowY="auto">
        {/* Search Results */}
        {hasResults ? (
          <VStack align="stretch" gap={0}>
            {searchResults.map((item, index) => {
              const isSelected = index === selectedIndex
              const isValueMatch = !!item.presetValue
              const resultKey = `${item.parentId}-${item.property.id}-${item.presetValue ?? ''}`

              return (
                <Flex
                  key={resultKey}
                  align="center"
                  justify="space-between"
                  px={4}
                  py={2}
                  cursor="pointer"
                  bg={isSelected ? 'gray.100' : 'transparent'}
                  _hover={{ bg: isSelected ? 'gray.100' : 'gray.50' }}
                  onClick={() => handleSearchResultClick(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Box flex={1}>
                    <Flex align="center" gap={1.5} flexWrap="wrap">
                      <Text fontSize="sm" fontWeight="medium">{item.property.name}</Text>
                      {isValueMatch && (
                        <>
                          <Text fontSize="sm" color="gray.400">=</Text>
                          <Badge colorScheme="gray" fontSize="xs" px={1.5} py={0.5}>
                            {item.presetValue}
                          </Badge>
                        </>
                      )}
                    </Flex>
                    <Text fontSize="xs" color="gray.500">from {item.parentName}</Text>
                  </Box>
                  <Box
                    opacity={isSelected ? 1 : 0}
                    transition="opacity 0.2s"
                    display="flex"
                    alignItems="center"
                  >
                    <AddIcon fontSize="small" style={{ fontSize: '16px', color: '#A0AEC0' }} />
                  </Box>
                </Flex>
              )
            })}

            {/* Build with AI — always at the bottom of results when there's a query */}
            {onSwitchToAI && (
              <Flex
                align="center"
                px={4}
                py={2.5}
                cursor="pointer"
                bg="purple.50"
                borderTop="1px solid"
                borderColor="gray.100"
                _hover={{ bg: 'purple.100' }}
                onClick={triggerAI}
              >
                <AutoAwesomeIcon fontSize="small" style={{ color: '#805AD5', marginRight: '8px', fontSize: '16px' }} />
                <Text fontSize="sm" color="purple.700">
                  Build with AI: '{searchQuery}'
                </Text>
              </Flex>
            )}
          </VStack>
        ) : noResults ? (
          /* No property matches — show prominent AI button */
          <Box px={4} py={2}>
            {onSwitchToAI && (
              <Flex
                align="center"
                px={3}
                py={2.5}
                cursor="pointer"
                bg="purple.50"
                borderRadius="md"
                border="1px solid"
                borderColor={isAIMode ? 'purple.300' : 'purple.100'}
                _hover={{ bg: 'purple.100' }}
                onClick={triggerAI}
                transition="all 0.2s"
              >
                <AutoAwesomeIcon fontSize="small" style={{ color: '#805AD5', marginRight: '8px' }} />
                <Text fontSize="sm" color="purple.700">
                  Build with AI: '{searchQuery}'
                </Text>
              </Flex>
            )}
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
                  {factsExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                  <Text fontWeight="semibold" fontSize="sm">Facts</Text>
                </Flex>
                <Badge colorScheme="gray" fontSize="xs">{filteredFacts.length}</Badge>
              </Flex>

              {factsExpanded && (
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
                        <Text fontSize="sm" fontWeight="medium">{fact.name}</Text>
                        {fact.description && (
                          <Text fontSize="xs" color="gray.500" lineClamp={1}>{fact.description}</Text>
                        )}
                      </Box>
                      <ChevronRightIcon fontSize="small" style={{ color: '#A0AEC0' }} />
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>

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
                  {engagementsExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                  <Text fontWeight="semibold" fontSize="sm">Engagements</Text>
                </Flex>
                <Badge colorScheme="gray" fontSize="xs">{filteredEngagements.length}</Badge>
              </Flex>

              {engagementsExpanded && (
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
                        <Text fontSize="sm" fontWeight="medium">{engagement.name}</Text>
                        {engagement.description && (
                          <Text fontSize="xs" color="gray.500" lineClamp={1}>{engagement.description}</Text>
                        )}
                      </Box>
                      <ChevronRightIcon fontSize="small" style={{ color: '#A0AEC0' }} />
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        ) : (
          // Detail View
          <VStack align="stretch" gap={0}>
            {filteredProperties.map((property) => {
              const propertyKey = `${navigationView.type === 'fact-detail' ? navigationView.fact.id : navigationView.engagement.id}-${property.id}`
              const propertyRef: PropertyReference = navigationView.type === 'fact-detail'
                ? { type: 'fact', parentId: navigationView.fact.id, parentName: navigationView.fact.name, property }
                : { type: 'engagement', parentId: navigationView.engagement.id, parentName: navigationView.engagement.name, property }

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
