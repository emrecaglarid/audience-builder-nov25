import { Box, Flex, Input, IconButton, Button, Text, Badge } from '@chakra-ui/react'
import { Menu } from '@chakra-ui/react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import HistoryIcon from '@mui/icons-material/History'
import DeleteIcon from '@mui/icons-material/Delete'
import UnpublishedIcon from '@mui/icons-material/Unpublished'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type AudienceStatus = 'draft' | 'published'

interface EditorHeaderProps {
  audienceName: string
  status: AudienceStatus
  hasUnsavedChanges: boolean
  isViewMode: boolean
  hasCompleteRule: boolean
  onNameChange: (name: string) => void
  onSave: () => void
  onPublish: () => void
  onAnalyze: () => void
  onEdit: () => void
  lastModified: string
  hasHistoricalData?: boolean
  isLoadingData?: boolean
  onLoadHistoricalData?: () => void
  onUnpublish?: () => void
}

function EditorHeader({
  audienceName,
  status,
  hasUnsavedChanges,
  isViewMode,
  hasCompleteRule,
  onNameChange,
  onSave,
  onPublish,
  onAnalyze,
  onEdit,
  lastModified,
  hasHistoricalData,
  isLoadingData,
  onLoadHistoricalData,
  onUnpublish
}: EditorHeaderProps) {
  const navigate = useNavigate()
  const [isEditingName, setIsEditingName] = useState(false)

  // Determine badge based on status
  const getStatusBadge = () => {
    if (status === 'published' && !hasUnsavedChanges) {
      return <Badge colorScheme="green" fontSize="xs">Published</Badge>
    }
    if (status === 'draft' && !hasUnsavedChanges) {
      return <Badge colorScheme="gray" fontSize="xs">Draft</Badge>
    }
    if (hasUnsavedChanges) {
      return <Badge colorScheme="orange" fontSize="xs">Unsaved draft</Badge>
    }
    return null
  }
  const [tempName, setTempName] = useState(audienceName)

  const handleNameSave = () => {
    onNameChange(tempName)
    setIsEditingName(false)
  }

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      setTempName(audienceName)
      setIsEditingName(false)
    }
  }

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      height="60px"
      bg="#fbfbfb"
      zIndex={100}
      px={6}
    >
      <Flex height="100%" alignItems="center" justifyContent="space-between">
        {/* Left side */}
        <Flex alignItems="center" gap={3}>
          <IconButton
            aria-label="Go back"
            variant="ghost"
            onClick={() => navigate('/')}
            size="sm"
          >
            <ArrowBackIcon />
          </IconButton>

          {isEditingName ? (
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyPress}
              autoFocus
              size="lg"
              fontWeight="semibold"
              width="300px"
            />
          ) : (
            <Flex alignItems="center" gap={2}>
              <Text fontSize="xl" fontWeight="semibold">
                {audienceName}
              </Text>
              <IconButton
                aria-label="Edit name"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingName(true)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Flex>
          )}
        </Flex>

        {/* Right side */}
        <Flex alignItems="center" gap={4}>
          <Flex alignItems="center" gap={2}>
            {getStatusBadge()}
            <Text fontSize="sm" color="gray.600">
              Last modified: {lastModified}
            </Text>
          </Flex>

          {/* Secondary actions - left */}
          {isViewMode && status === 'published' && !hasHistoricalData && onLoadHistoricalData && (
            <Button
              variant="outline"
              size="md"
              onClick={onLoadHistoricalData}
              disabled={isLoadingData}
            >
              Load Historical Data
            </Button>
          )}

          {!isViewMode && hasCompleteRule && status === 'published' && (
            <Button variant="outline" size="md" onClick={onAnalyze}>
              Analyze
            </Button>
          )}

          {/* Primary CTA - right side */}
          {hasUnsavedChanges && status === 'draft' && (
            <Button colorScheme="purple" size="md" onClick={onSave}>
              Save as draft
            </Button>
          )}

          {hasUnsavedChanges && status === 'published' && !isViewMode && (
            <Button colorScheme="purple" size="md" onClick={onSave}>
              Save changes
            </Button>
          )}

          {!hasUnsavedChanges && status === 'draft' && (
            <Button colorScheme="purple" size="md" onClick={onPublish}>
              Publish
            </Button>
          )}

          {isViewMode && (
            <Button colorScheme="purple" size="md" onClick={onEdit}>
              Edit
            </Button>
          )}

          {/* Three-dot menu - rightmost */}
          <Menu.Root positioning={{ placement: 'bottom-end', strategy: 'fixed' }}>
            <Menu.Trigger asChild>
              <IconButton
                aria-label="More options"
                variant="ghost"
                size="sm"
              >
                <MoreVertIcon />
              </IconButton>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="duplicate" onClick={() => console.log('Duplicate clicked')}>
                  <Flex align="center" gap={2}>
                    <FileCopyIcon fontSize="small" />
                    <Text>Duplicate</Text>
                  </Flex>
                </Menu.Item>

                <Menu.Item value="activity-log" onClick={() => console.log('Activity log clicked')}>
                  <Flex align="center" gap={2}>
                    <HistoryIcon fontSize="small" />
                    <Text>Activity log</Text>
                  </Flex>
                </Menu.Item>

                {status === 'published' && onUnpublish && (
                  <Menu.Item value="unpublish" onClick={onUnpublish}>
                    <Flex align="center" gap={2}>
                      <UnpublishedIcon fontSize="small" />
                      <Text>Unpublish</Text>
                    </Flex>
                  </Menu.Item>
                )}

                <Menu.Item value="delete" onClick={() => console.log('Delete clicked')}>
                  <Flex align="center" gap={2} color="red.500">
                    <DeleteIcon fontSize="small" />
                    <Text>Delete</Text>
                  </Flex>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Flex>
      </Flex>
    </Box>
  )
}

export default EditorHeader
