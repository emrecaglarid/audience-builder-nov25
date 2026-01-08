import { Box, Input, IconButton, Text, Flex, Button } from '@chakra-ui/react'
import { Menu } from '@chakra-ui/react'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useState, useMemo, ChangeEvent } from 'react'
import type { PropertyDefinition } from '../../types/schema'
import type { ComparisonOperator, DateOperator } from '../../types/query'
import type { TimePeriod } from './CriteriaSection'

// Time period labels for read-only display
const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  last7days: 'last 7 days',
  last30days: 'last 30 days',
  last90days: 'last 90 days',
  lastYear: 'last year',
  allTime: 'all time',
  customRange: 'custom range',
  perRule: 'per rule',
}

interface RuleRowProps {
  ruleId: string
  ruleName: string
  parentName: string
  properties: PropertyDefinition[]
  preSelectedProperty?: string // Property ID to pre-select and disable selector
  initialOperator?: string // Initial operator value from saved data
  initialValue?: string | number | boolean // Initial value from saved data
  excluded?: boolean
  disabled?: boolean
  comment?: string
  trackVariable?: string
  sectionId?: string // To conditionally enable "Exclude matches" for entry section only
  isInSelectionMode?: boolean // Whether the section is in selection mode for grouping
  isSelected?: boolean // Whether this rule is currently selected
  isLast?: boolean // Whether this is the last rule in the list (no bottom border)
  isInGroup?: boolean // Whether this rule is inside a RuleGroup (no borders)
  isIndented?: boolean // Whether to indent the name (for rules inside groups)
  matchCount?: number // Individual match count for this rule
  showMatchCount?: boolean // Whether to display the match count
  showTimePeriod?: boolean // Whether to show per-rule time period dropdown (legacy)
  isEngagement?: boolean // Whether this rule is an engagement (shows inline time dropdown)
  timePeriod?: TimePeriod // The rule's individual time period
  isReadOnly?: boolean // Whether to render in read-only mode (no inputs/actions)
  onDelete: () => void
  onChange?: (data: {
    property: string
    operator: string
    value: string | number | boolean
  }) => void
  onToggleExcluded?: () => void
  onToggleDisabled?: () => void
  onCommentChange?: (comment: string) => void
  onTrackVariableChange?: (variable: string) => void
  onToggleSelection?: () => void
  onTimePeriodChange?: (timePeriod: TimePeriod) => void
}

// Operator options based on data type
const getOperatorsForType = (dataType: string): Array<{ value: ComparisonOperator | DateOperator; label: string }> => {
  switch (dataType) {
    case 'string':
      return [
        { value: 'equals', label: 'equals' },
        { value: 'notEquals', label: 'does not equal' },
        { value: 'contains', label: 'contains' },
        { value: 'startsWith', label: 'starts with' },
        { value: 'endsWith', label: 'ends with' }
      ]
    case 'number':
      return [
        { value: 'equals', label: 'equals' },
        { value: 'notEquals', label: 'does not equal' },
        { value: 'greaterThan', label: 'greater than' },
        { value: 'lessThan', label: 'less than' },
        { value: 'greaterThanOrEqual', label: 'greater than or equal to' },
        { value: 'lessThanOrEqual', label: 'less than or equal to' },
        { value: 'between', label: 'between' }
      ]
    case 'boolean':
      return [
        { value: 'isTrue', label: 'is true' },
        { value: 'isFalse', label: 'is false' }
      ]
    case 'date':
      return [
        { value: 'before', label: 'before' },
        { value: 'after', label: 'after' },
        { value: 'between', label: 'between' },
        { value: 'last7days', label: 'last 7 days' },
        { value: 'last30days', label: 'last 30 days' },
        { value: 'last90days', label: 'last 90 days' },
        { value: 'lastYear', label: 'last year' },
        { value: 'allTime', label: 'all time' }
      ]
    default:
      return [{ value: 'equals', label: 'equals' }]
  }
}

export function RuleRow({
  ruleId: _ruleId,
  ruleName,
  properties,
  preSelectedProperty,
  initialOperator,
  initialValue,
  excluded = false,
  disabled = false,
  comment,
  trackVariable,
  sectionId,
  isInSelectionMode = false,
  isSelected = false,
  isLast = false,
  isInGroup = false,
  isIndented = false,
  matchCount,
  showMatchCount = false,
  showTimePeriod = false,
  isEngagement = false,
  timePeriod,
  isReadOnly = false,
  onDelete,
  onChange,
  onToggleExcluded,
  onToggleDisabled,
  onCommentChange,
  onTrackVariableChange,
  onToggleSelection,
  onTimePeriodChange,
}: RuleRowProps) {
  const [selectedProperty] = useState<string>(preSelectedProperty || '')
  const [selectedOperator, setSelectedOperator] = useState<string>(initialOperator || '')
  const [value, setValue] = useState<string>(initialValue !== undefined ? String(initialValue) : '')
  const [value2, setValue2] = useState<string>('') // For "between" operator
  const [error] = useState<string | null>(null) // TODO: Implement validation logic
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [commentText, setCommentText] = useState(comment || '')
  const [isEditingVariable, setIsEditingVariable] = useState(false)
  const [variableText, setVariableText] = useState(trackVariable || '')

  // Get the currently selected property definition
  const currentProperty = useMemo(() => {
    return properties.find(p => p.id === selectedProperty)
  }, [properties, selectedProperty])

  // Get operators for the current property type
  const operators = useMemo(() => {
    if (!currentProperty) return []
    return getOperatorsForType(currentProperty.dataType)
  }, [currentProperty])

  // Property is now always pre-selected, no need for handlePropertyChange

  // Keyboard handlers for comment editor
  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onCommentChange?.(commentText)
      setIsEditingComment(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setCommentText(comment || '')
      setIsEditingComment(false)
    }
  }

  // Keyboard handlers for variable editor
  const handleVariableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onTrackVariableChange?.(variableText)
      setIsEditingVariable(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setVariableText(trackVariable || '')
      setIsEditingVariable(false)
    }
  }

  const handleOperatorChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const operator = e.target.value
    setSelectedOperator(operator)
    notifyChange(selectedProperty, operator, value)
  }

  const handleValueChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    notifyChange(selectedProperty, selectedOperator, newValue)
  }

  const notifyChange = (property: string, operator: string, val: string) => {
    if (property && operator && onChange) {
      // Convert value based on property type
      let convertedValue: string | number | boolean = val
      if (currentProperty?.dataType === 'number') {
        convertedValue = parseFloat(val) || 0
      } else if (currentProperty?.dataType === 'boolean') {
        convertedValue = val === 'true'
      }
      onChange({ property, operator, value: convertedValue })
    }
  }

  return (
    <Box
      borderBottom={isInGroup || isLast ? 'none' : '1px solid'}
      borderColor="gray.100"
      borderLeft={isSelected ? '3px solid' : undefined}
      borderLeftColor={isSelected ? 'blue.500' : undefined}
      opacity={disabled ? 0.4 : 1}
    >
      {/* Main row: Single line with all controls */}
      <Flex
        align="center"
        gap={3}
        py={2}
        px={3}
        bg={isSelected ? 'blue.50' : (excluded ? 'red.50' : undefined)}
        _hover={{ bg: isSelected ? 'blue.100' : (excluded ? 'red.100' : 'gray.50') }}
        transition="background 0.2s"
      >
        {/* Selection checkbox - only visible in selection mode */}
        {isInSelectionMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer',
            }}
          />
        )}

        {/* Property name - with optional indent for grouped items */}
        <Box minW="150px" flex="0 0 auto" ml={isIndented ? 6 : 0}>
          {excluded && (
            <Text fontSize="xs" fontWeight="medium" color="red.600" mb={0.5}>
              Exclude if
            </Text>
          )}
          <Text fontSize="sm" fontWeight="medium" color="gray.700">
            {ruleName}
          </Text>
        </Box>

        {/* Operator dropdown / text */}
        <Box flex="0 0 200px">
          {isReadOnly ? (
            <Text fontSize="sm" color="gray.600">
              {operators.find(op => op.value === selectedOperator)?.label || selectedOperator || '—'}
            </Text>
          ) : (
            <select
              value={selectedOperator}
              onChange={handleOperatorChange}
              disabled={disabled}
              style={{
                fontSize: '14px',
                width: '100%',
                borderWidth: '1px',
                borderColor: '#E2E8F0',
                borderRadius: '6px',
                padding: '6px 12px',
                backgroundColor: 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">Select operator</option>
              {operators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          )}
        </Box>

        {/* Value input / text - only shown when operator needs a value */}
        {selectedOperator &&
         selectedOperator !== 'isTrue' &&
         selectedOperator !== 'isFalse' &&
         !selectedOperator.startsWith('last') &&
         selectedOperator !== 'allTime' ? (
          <Box flex="1" minW="0">
            {isReadOnly ? (
              // Read-only: show value as text
              <Text fontSize="sm" color="gray.700">
                {selectedOperator === 'between' && value2
                  ? `${value || '—'} and ${value2}`
                  : value || '—'}
              </Text>
            ) : selectedOperator === 'between' ? (
              <Flex gap={2} align="center">
                <Input
                  placeholder="Lower value"
                  value={value}
                  onChange={handleValueChange}
                  disabled={disabled}
                  type={currentProperty?.dataType === 'number' ? 'number' : currentProperty?.dataType === 'date' ? 'date' : 'text'}
                  size="sm"
                  flex="1"
                  borderColor={error ? 'red.500' : 'gray.200'}
                />
                <Text fontSize="xs" color="gray.500">
                  and
                </Text>
                <Input
                  placeholder="Upper value"
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                  disabled={disabled}
                  type={currentProperty?.dataType === 'number' ? 'number' : currentProperty?.dataType === 'date' ? 'date' : 'text'}
                  size="sm"
                  flex="1"
                  borderColor={error ? 'red.500' : 'gray.200'}
                />
              </Flex>
            ) : currentProperty?.allowedValues ? (
              <select
                value={value}
                onChange={handleValueChange}
                disabled={disabled}
                style={{
                  fontSize: '14px',
                  width: '100%',
                  borderWidth: '1px',
                  borderColor: error ? '#E53E3E' : '#E2E8F0',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="">Select option</option>
                {currentProperty.allowedValues.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Enter value"
                value={value}
                onChange={handleValueChange}
                disabled={disabled}
                type={currentProperty?.dataType === 'number' ? 'number' : currentProperty?.dataType === 'date' ? 'date' : 'text'}
                size="sm"
                borderColor={error ? 'red.500' : 'gray.200'}
              />
            )}
          </Box>
        ) : (
          <Box flex="1" />
        )}

        {/* Per-rule time period dropdown / text - show for engagements or when explicitly enabled */}
        {(isEngagement || showTimePeriod) && (
          <Box flex="0 0 auto">
            {isReadOnly ? (
              <Text fontSize="sm" color="gray.500">
                {TIME_PERIOD_LABELS[timePeriod || 'last30days']}
              </Text>
            ) : (
              <select
                value={timePeriod || 'last30days'}
                onChange={(e) => onTimePeriodChange?.(e.target.value as TimePeriod)}
                disabled={disabled}
                style={{
                  fontSize: '13px',
                  borderWidth: '1px',
                  borderColor: '#E2E8F0',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  backgroundColor: 'white',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  color: '#4A5568',
                }}
              >
                <option value="last7days">last 7 days</option>
                <option value="last30days">last 30 days</option>
                <option value="last90days">last 90 days</option>
                <option value="lastYear">last year</option>
                <option value="allTime">all time</option>
              </select>
            )}
          </Box>
        )}

        {/* Metadata Icon Buttons - only show when active and not read-only */}
        {!isReadOnly && (
          <Flex align="center" gap={0.5}>
            {/* Disable - only show when disabled */}
            {disabled && (
              <IconButton
                aria-label="Disable rule"
                title="Disable rule"
                size="sm"
                variant="ghost"
                onClick={onToggleDisabled}
                color="gray.600"
                _hover={{ color: 'gray.600' }}
              >
                <VisibilityOffIcon fontSize="small" />
              </IconButton>
            )}
          </Flex>
        )}

        {/* Actions: Match count badge + Three-dot menu + Delete button */}
        <Flex align="center" gap={1}>
          {/* Match count badge - only show when enabled */}
          {showMatchCount && matchCount !== undefined && (
            <Text
              fontSize="xs"
              bg="gray.100"
              px={2}
              py={0.5}
              borderRadius="full"
              color="gray.600"
            >
              {matchCount >= 1000 ? (matchCount / 1000).toFixed(1) + 'K' : matchCount.toLocaleString()}
            </Text>
          )}

          {/* Three-dot menu and Delete button - hide in read-only mode */}
          {!isReadOnly && (
            <>
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
                    {/* Exclude matches - only for entry section */}
                    {sectionId === 'entry' && (
                      <Menu.Item value="exclude" onClick={onToggleExcluded}>
                        <Text>{excluded ? 'Include matches' : 'Exclude matches'}</Text>
                      </Menu.Item>
                    )}

                    {/* Disable */}
                    <Menu.Item value="disable" onClick={onToggleDisabled}>
                      <Text>Disable</Text>
                    </Menu.Item>

                    {/* Comment */}
                    <Menu.Item value="comment" onClick={() => setIsEditingComment(true)}>
                      <Text>{comment ? 'Edit comment' : 'Add comment'}</Text>
                    </Menu.Item>

                    <Menu.Separator />

                    {/* Store data */}
                    <Menu.Item value="track" onClick={() => setIsEditingVariable(true)}>
                      <Text>{trackVariable ? 'Edit variable' : 'Store data'}</Text>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>

              {/* Delete button */}
              <IconButton
                aria-label="Delete rule"
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={onDelete}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Flex>
      </Flex>

      {/* Comment display - always visible when comment exists */}
      {comment && !isEditingComment && (
        <Box
          px={3}
          pb={2}
          pt={1}
          pl="40px"
          bg={excluded ? 'red.50' : undefined}
          cursor={isReadOnly ? 'default' : 'pointer'}
          onClick={isReadOnly ? undefined : () => setIsEditingComment(true)}
          _hover={isReadOnly ? undefined : { bg: excluded ? 'red.100' : 'gray.50' }}
          transition="background 0.2s"
        >
          <Flex align="flex-start" gap={2}>
            <Text fontSize="xs" color="gray.400">└─</Text>
            <Text fontSize="sm" color="gray.600" fontStyle="italic">
              "{comment}"
            </Text>
          </Flex>
        </Box>
      )}

      {/* Store variable display - always visible when variable is assigned */}
      {trackVariable && !isEditingVariable && (
        <Box
          px={3}
          pb={2}
          pt={1}
          pl="40px"
          bg={excluded ? 'red.50' : undefined}
          cursor={isReadOnly ? 'default' : 'pointer'}
          onClick={isReadOnly ? undefined : () => setIsEditingVariable(true)}
          _hover={isReadOnly ? undefined : { bg: excluded ? 'red.100' : 'gray.50' }}
          transition="background 0.2s"
        >
          <Flex align="flex-start" gap={2}>
            <Text fontSize="xs" color="gray.400">└─</Text>
            <Text fontSize="sm" color="purple.600">
              Storing data from matches as: {trackVariable}
            </Text>
          </Flex>
        </Box>
      )}

      {/* Comment editor (inline expansion) */}
      {isEditingComment && (
        <Box px={3} pb={2} pl="40px" bg={excluded ? 'red.50' : undefined}>
          <Flex gap={2} align="flex-start">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleCommentKeyDown}
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
                setCommentText(comment || '')
                setIsEditingComment(false)
              }}
            >
              ✕
            </IconButton>
            {comment && (
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

      {/* Variable editor (inline expansion) */}
      {isEditingVariable && (
        <Box px={3} pb={2} pl="40px" bg={excluded ? 'red.50' : undefined}>
          <Flex gap={2} align="flex-start">
            <Input
              placeholder="Enter variable name..."
              value={variableText}
              onChange={(e) => setVariableText(e.target.value)}
              onKeyDown={handleVariableKeyDown}
              size="sm"
              autoFocus
            />
            <IconButton
              aria-label="Save variable"
              size="sm"
              colorScheme="blue"
              onClick={() => {
                onTrackVariableChange?.(variableText)
                setIsEditingVariable(false)
              }}
            >
              ✓
            </IconButton>
            <IconButton
              aria-label="Cancel"
              size="sm"
              variant="ghost"
              onClick={() => {
                setVariableText(trackVariable || '')
                setIsEditingVariable(false)
              }}
            >
              ✕
            </IconButton>
            {trackVariable && (
              <IconButton
                aria-label="Delete variable"
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => {
                  onTrackVariableChange?.('')
                  setVariableText('')
                  setIsEditingVariable(false)
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
            <Button variant="ghost" size="sm" colorScheme="purple">
              All variables
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  )
}
