import { Box, IconButton, Text, Flex, Input, VStack } from '@chakra-ui/react'
import { Menu } from '@chakra-ui/react'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CommentIcon from '@mui/icons-material/Comment'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { useState } from 'react'
import type { AddedDestination } from '../../types/destination'
import { getPlatformMeta } from '../../data/destinationMocks'

interface DestinationRowProps {
  destination: AddedDestination
  destinationIndex: number
  experimentMode?: boolean
  onDelete: () => void
  onTogglePaused?: () => void
  onCommentChange?: (comment: string) => void
  onPercentageChange?: (percentage: number) => void
  onTargetAudienceChange?: (audienceName: string) => void
}

export function DestinationRow({
  destination,
  destinationIndex,
  experimentMode = false,
  onDelete,
  onTogglePaused,
  onCommentChange,
  onPercentageChange,
  onTargetAudienceChange,
}: DestinationRowProps) {
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [commentText, setCommentText] = useState(destination.comment || '')
  const [targetAudienceName, setTargetAudienceName] = useState(destination.targetAudienceName || '')

  const platformMeta = getPlatformMeta(destination.platformType)
  const isPaused = destination.status === 'paused' || destination.disabled

  // Color matching slider
  const colors = ['blue.500', 'green.500', 'purple.500', 'orange.500', 'pink.500']
  const color = colors[destinationIndex % colors.length]

  return (
    <Box
      borderBottom="1px solid"
      borderColor="gray.100"
      opacity={isPaused ? 0.6 : 1}
    >
      {/* Main row */}
      <Flex
        align="center"
        gap={3}
        py={2}
        px={3}
        _hover={{ bg: 'gray.50' }}
        transition="background 0.2s"
      >
        {/* Color indicator dot (only in experiment mode) */}
        {experimentMode && (
          <Box
            w="8px"
            h="8px"
            borderRadius="full"
            bg={color}
            flex="0 0 auto"
          />
        )}

        {/* Platform and account names stacked */}
        <VStack align="flex-start" gap={0} minW="150px" flex="0 0 auto">
          <Text fontSize="sm" color="gray.600">
            {platformMeta.displayName}
          </Text>
          <Text fontSize="xs" color="gray.500" lineClamp={1}>
            {destination.accountName}
          </Text>
        </VStack>

        {/* Target audience input */}
        <Box flex="1" minW="0">
          <Input
            placeholder="Target audience name..."
            value={targetAudienceName}
            onChange={(e) => setTargetAudienceName(e.target.value)}
            onBlur={() => onTargetAudienceChange?.(targetAudienceName)}
            size="sm"
            fontSize="sm"
          />
        </Box>

        {/* Experiment mode: percentage input */}
        {experimentMode && (
          <Box flex="0 0 80px">
            <Input
              type="number"
              min={0}
              max={100}
              value={destination.trafficPercentage || 0}
              onChange={(e) => onPercentageChange?.(parseInt(e.target.value) || 0)}
              size="sm"
              textAlign="right"
              pr="24px"
            />
            <Text
              position="absolute"
              right="8px"
              top="50%"
              transform="translateY(-50%)"
              fontSize="xs"
              color="gray.500"
              pointerEvents="none"
            >
              %
            </Text>
          </Box>
        )}

        {/* Actions: Three-dot menu + Delete button */}
        <Flex align="center" gap={1}>
          {/* Three-dot menu */}
          <Menu.Root positioning={{ placement: 'bottom-end', strategy: 'fixed' }}>
            <Menu.Trigger asChild>
              <IconButton
                aria-label="More options"
                size="sm"
                variant="ghost"
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                {/* Pause/Resume */}
                <Menu.Item value="pause" onClick={onTogglePaused}>
                  <Flex align="center" gap={2}>
                    {isPaused ? <PlayArrowIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
                    <Text>{isPaused ? 'Resume' : 'Pause'}</Text>
                  </Flex>
                </Menu.Item>

                {/* Comment */}
                <Menu.Item value="comment" onClick={() => setIsEditingComment(true)}>
                  <Flex align="center" gap={2}>
                    <CommentIcon fontSize="small" />
                    <Text>{destination.comment ? 'Edit comment' : 'Add comment'}</Text>
                  </Flex>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>

          {/* Delete button */}
          <IconButton
            aria-label="Delete destination"
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={onDelete}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Flex>
      </Flex>

      {/* Comment display - always visible when comment exists */}
      {destination.comment && !isEditingComment && (
        <Box
          px={3}
          pb={2}
          pt={1}
          pl="40px"
          cursor="pointer"
          onClick={() => setIsEditingComment(true)}
          _hover={{ bg: 'gray.50' }}
          transition="background 0.2s"
        >
          <Flex align="flex-start" gap={2}>
            <Text fontSize="xs" color="gray.400">└─</Text>
            <Text fontSize="sm" color="gray.600" fontStyle="italic">
              "{destination.comment}"
            </Text>
          </Flex>
        </Box>
      )}

      {/* Comment editor (inline expansion) */}
      {isEditingComment && (
        <Box px={3} pb={2} pl="40px">
          <Flex gap={2} align="flex-start">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              size="sm"
              autoFocus
            />
            <IconButton
              aria-label="Save comment"
              size="sm"
              colorScheme="blue"
              onClick={() => {
                onCommentChange?.(commentText)
                setIsEditingComment(false)
              }}
            >
              ✓
            </IconButton>
            <IconButton
              aria-label="Cancel"
              size="sm"
              variant="ghost"
              onClick={() => {
                setCommentText(destination.comment || '')
                setIsEditingComment(false)
              }}
            >
              ✕
            </IconButton>
            {destination.comment && (
              <IconButton
                aria-label="Delete comment"
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => {
                  onCommentChange?.('')
                  setCommentText('')
                  setIsEditingComment(false)
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Flex>
        </Box>
      )}

      {/* Error message display */}
      {destination.status === 'error' && destination.errorMessage && (
        <Box
          px={3}
          pb={2}
          pt={1}
          pl="40px"
          bg="red.50"
        >
          <Flex align="flex-start" gap={2}>
            <Text fontSize="xs" color="gray.400">⚠</Text>
            <Text fontSize="sm" color="red.600">
              {destination.errorMessage}
            </Text>
          </Flex>
        </Box>
      )}
    </Box>
  )
}
