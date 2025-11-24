import { Box, Button, Text, Flex } from '@chakra-ui/react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddIcon from '@mui/icons-material/Add'
import { useDroppable } from '@dnd-kit/core'
import { useState, useRef } from 'react'
import { DestinationRow } from './DestinationRow'
import { DestinationPickerModal } from './DestinationPickerModal'
import type { AddedDestination, Destination } from '../../types/destination'

interface TrafficSplitSliderProps {
  destinations: AddedDestination[]
  onPercentageChange: (destinationId: string, percentage: number, autoAdjust?: boolean) => void
}

function TrafficSplitSlider({ destinations, onPercentageChange }: TrafficSplitSliderProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const colors = ['blue.500', 'green.500', 'purple.500', 'orange.500', 'pink.500']

  const handleDividerMouseDown = (dividerIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingIndex(dividerIndex)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!barRef.current) return

      const barRect = barRef.current.getBoundingClientRect()
      const barWidth = barRect.width
      const mouseX = moveEvent.clientX - barRect.left

      // Calculate percentage position (0-100)
      const positionPercent = Math.max(0, Math.min(100, (mouseX / barWidth) * 100))

      // Calculate cumulative percentages before this divider
      let cumulativeBefore = 0
      for (let i = 0; i < dividerIndex; i++) {
        cumulativeBefore += destinations[i].trafficPercentage || 0
      }

      // Calculate cumulative percentages after the next segment
      let cumulativeAfter = 0
      for (let i = dividerIndex + 2; i < destinations.length; i++) {
        cumulativeAfter += destinations[i].trafficPercentage || 0
      }

      // Calculate new percentage for the left segment (rounded)
      const leftPercentage = Math.round(positionPercent - cumulativeBefore)

      // Calculate what's available for the right segment (ensures total = 100)
      const rightPercentage = 100 - cumulativeBefore - leftPercentage - cumulativeAfter

      // Only update if both segments are non-negative
      if (leftPercentage >= 0 && rightPercentage >= 0) {
        // Update the left segment with autoAdjust=true for slider drags
        onPercentageChange(destinations[dividerIndex].id, leftPercentage, true)
      }
    }

    const handleMouseUp = () => {
      setDraggingIndex(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <Box px={4} pt={3} pb={2}>
      <Text fontSize="xs" fontWeight="medium" color="gray.600" mb={2}>
        Traffic split
      </Text>
      <Box position="relative" userSelect="none">
        <Flex
          ref={barRef}
          w="100%"
          h="8px"
          borderRadius="full"
          overflow="visible"
          bg="gray.100"
          position="relative"
        >
          {destinations.map((dest, index) => {
            const percentage = dest.trafficPercentage || 0
            const color = colors[index % colors.length]

            return (
              <Box
                key={dest.id}
                w={`${percentage}%`}
                h="100%"
                bg={color}
                transition={draggingIndex === null ? 'width 0.3s' : 'none'}
                position="relative"
              />
            )
          })}
        </Flex>

        {/* Draggable dividers */}
        {destinations.slice(0, -1).map((dest, index) => {
          // Calculate cumulative position for this divider
          let cumulativePercent = 0
          for (let i = 0; i <= index; i++) {
            cumulativePercent += destinations[i].trafficPercentage || 0
          }

          const isHovered = hoverIndex === index
          const isDragging = draggingIndex === index

          return (
            <Box
              key={`divider-${dest.id}`}
              position="absolute"
              top="50%"
              left={`${cumulativePercent}%`}
              transform="translate(-50%, -50%)"
              w="16px"
              h="16px"
              cursor="ew-resize"
              onMouseDown={handleDividerMouseDown(index)}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              zIndex={10}
            >
              <Box
                w="3px"
                h="16px"
                bg={isDragging || isHovered ? 'gray.700' : 'gray.400'}
                borderRadius="sm"
                mx="auto"
                transition="background 0.2s"
                boxShadow={isDragging || isHovered ? 'md' : 'sm'}
              />
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

interface SyncSectionProps {
  destinations: AddedDestination[]
  experimentMode: boolean
  isCollapsed?: boolean
  isModalOpen: boolean
  isActive?: boolean
  onToggleCollapse?: () => void
  onSetActive?: () => void
  onOpenModal: () => void
  onCloseModal: () => void
  onSelectDestination: (destination: Destination) => void
  onDestinationDelete: (destinationId: string) => void
  onDestinationTogglePaused: (destinationId: string) => void
  onDestinationCommentChange: (destinationId: string, comment: string) => void
  onDestinationPercentageChange: (destinationId: string, percentage: number, autoAdjust?: boolean) => void
  onDestinationTargetAudienceChange: (destinationId: string, audienceName: string) => void
  onExperimentToggle: () => void
  onSplitEqually: () => void
}

export function SyncSection({
  destinations,
  experimentMode,
  isCollapsed = false,
  isModalOpen,
  isActive = false,
  onToggleCollapse,
  onSetActive,
  onOpenModal,
  onCloseModal,
  onSelectDestination,
  onDestinationDelete,
  onDestinationTogglePaused,
  onDestinationCommentChange,
  onDestinationPercentageChange,
  onDestinationTargetAudienceChange,
  onExperimentToggle,
  onSplitEqually,
}: SyncSectionProps) {
  // Set up droppable for this section
  const { setNodeRef, isOver } = useDroppable({
    id: 'sync',
    data: {
      type: 'section',
      sectionId: 'sync',
    },
  })

  // Calculate total percentage for experiment mode
  const totalPercentage = destinations.reduce((sum, dest) => sum + (dest.trafficPercentage || 0), 0)
  const hasPercentageError = experimentMode && totalPercentage !== 100

  return (
    <>
      <Box
        ref={setNodeRef}
        bg="white"
        borderRadius="lg"
        border="1px solid"
        borderColor={isActive ? 'blue.500' : (isOver ? 'blue.400' : 'gray.200')}
        overflow="hidden"
        mb={4}
        boxShadow={isActive ? '0 0 0 3px rgba(66, 153, 225, 0.15)' : (isOver ? 'lg' : 'none')}
        transition="all 0.2s"
        cursor="pointer"
        onClick={onSetActive}
      >
        {/* Section Header */}
        <Flex
          align="center"
          justify="space-between"
          px={4}
          py={3}
          borderBottom={!isCollapsed && destinations.length > 0 ? '1px solid' : 'none'}
          borderColor="gray.200"
          cursor="pointer"
          onClick={onToggleCollapse}
          _hover={{ bg: 'gray.50' }}
        >
          {/* Left side: Collapse icon + Title */}
          <Flex align="center" gap={2}>
            {/* Collapse icon */}
            {isCollapsed ? (
              <ChevronRightIcon fontSize="small" style={{ color: '#718096' }} />
            ) : (
              <ExpandMoreIcon fontSize="small" style={{ color: '#718096' }} />
            )}

            {/* Title */}
            <Text fontSize="md" fontWeight="semibold" color="gray.700">
              Sync and activation
            </Text>

            {/* Destination count badge */}
            {destinations.length > 0 && (
              <Box
                px={2}
                py={0.5}
                bg="blue.100"
                color="blue.700"
                borderRadius="full"
                fontSize="xs"
                fontWeight="medium"
              >
                {destinations.length}
              </Box>
            )}
          </Flex>

          {/* Right side: Experiment toggle (when 2+ destinations) */}
          {!isCollapsed && destinations.length >= 2 && (
            <Flex align="center" gap={2} onClick={(e) => e.stopPropagation()}>
              <Text fontSize="xs" color="gray.600">
                Experiment
              </Text>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={experimentMode}
                  onChange={onExperimentToggle}
                  style={{ display: 'none' }}
                />
                <Box
                  w="36px"
                  h="20px"
                  bg={experimentMode ? 'blue.500' : 'gray.300'}
                  borderRadius="full"
                  position="relative"
                  transition="background 0.2s"
                >
                  <Box
                    w="16px"
                    h="16px"
                    bg="white"
                    borderRadius="full"
                    position="absolute"
                    top="2px"
                    left={experimentMode ? '18px' : '2px'}
                    transition="left 0.2s"
                  />
                </Box>
              </label>
            </Flex>
          )}
        </Flex>

        {/* Section Content */}
        {!isCollapsed && (
          <>
            {/* Experiment mode: Warning or Slider (same height to prevent layout shift) */}
            {experimentMode && destinations.length > 0 && (
              <Box minH="48px">
                {hasPercentageError ? (
                  <Box px={4} py={3} bg="orange.50" borderBottom="1px solid" borderColor="orange.200" minH="48px" display="flex" alignItems="center" justifyContent="space-between">
                    <Text fontSize="sm" color="orange.700">
                      Traffic split must total 100% (currently {totalPercentage}%)
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="orange"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSplitEqually()
                      }}
                    >
                      Split equally
                    </Button>
                  </Box>
                ) : (
                  <TrafficSplitSlider
                    destinations={destinations}
                    onPercentageChange={onDestinationPercentageChange}
                  />
                )}
              </Box>
            )}

            {/* Destinations list */}
            {destinations.length > 0 && (
              <Box>
                {destinations.map((destination, index) => (
                  <DestinationRow
                    key={destination.id}
                    destination={destination}
                    destinationIndex={index}
                    experimentMode={experimentMode}
                    onDelete={() => onDestinationDelete(destination.id)}
                    onTogglePaused={() => onDestinationTogglePaused(destination.id)}
                    onCommentChange={(comment) => onDestinationCommentChange(destination.id, comment)}
                    onPercentageChange={(percentage) => onDestinationPercentageChange(destination.id, percentage)}
                    onTargetAudienceChange={(audienceName) => onDestinationTargetAudienceChange(destination.id, audienceName)}
                  />
                ))}
              </Box>
            )}

            {/* Add destination button */}
            <Box p={3} borderTop={destinations.length > 0 ? '1px solid' : 'none'} borderColor="gray.100">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenModal()
                }}
              >
                <AddIcon fontSize="small" style={{ marginRight: '8px' }} />
                Add destination
              </Button>
            </Box>
          </>
        )}
      </Box>

      {/* Destination Picker Modal */}
      <DestinationPickerModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSelect={onSelectDestination}
        excludeIds={destinations.map(d => d.id)}
      />
    </>
  )
}
