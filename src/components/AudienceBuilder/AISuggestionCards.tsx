import { Box, Text, Flex, Button, Badge, Portal } from '@chakra-ui/react';
import CheckIcon from '@mui/icons-material/Check';
import type { AISuggestion } from './aiSuggestions';

interface AISuggestionCardsProps {
  suggestions: AISuggestion[];
  explanation: string;
  onAddAll: () => void;
  onAddSingle: (suggestion: AISuggestion) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

// Format operator for display
function formatOperator(operator: string): string {
  const operatorLabels: Record<string, string> = {
    equals: 'equals',
    notEquals: 'does not equal',
    greaterThan: '>',
    lessThan: '<',
    greaterThanOrEqual: '≥',
    lessThanOrEqual: '≤',
    between: 'between',
    contains: 'contains',
    startsWith: 'starts with',
    endsWith: 'ends with',
    isTrue: 'is true',
    isFalse: 'is false',
    before: 'before',
    after: 'after',
    last7days: 'in last 7 days',
    last30days: 'in last 30 days',
    last90days: 'in last 90 days',
    lastYear: 'in last year',
    allTime: 'all time',
  };

  return operatorLabels[operator] || operator;
}

// Format value for display
function formatValue(value: string | number | boolean, operator: string): string {
  if (operator === 'isTrue' || operator === 'isFalse') return '';
  if (operator.startsWith('last') || operator === 'allTime') return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === '') return '';
  return String(value);
}

export function AISuggestionCards({
  suggestions,
  explanation,
  onAddAll,
  onAddSingle,
  inputRef,
}: AISuggestionCardsProps) {
  // Get input position for positioning
  const inputRect = inputRef.current?.getBoundingClientRect();

  return (
    <Portal>
      <Box
        position="fixed"
        top={inputRect ? `${inputRect.bottom + 4}px` : 0}
        left={inputRect ? `${inputRect.left}px` : 0}
        width={inputRect ? `${inputRect.width}px` : 'auto'}
        bg="white"
        border="1px solid"
        borderColor="blue.200"
        borderRadius="md"
        boxShadow="lg"
        zIndex={1500}
        p={3}
      >
        {/* Header with explanation */}
        <Flex align="center" justify="space-between" mb={suggestions.length > 0 ? 3 : 0}>
          <Flex align="center" gap={2}>
            <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
              AI Agent
            </Badge>
            <Text fontSize="sm" color="gray.600">
              {explanation}
            </Text>
          </Flex>
          {suggestions.length > 0 && (
            <Button
              size="xs"
              colorScheme="blue"
              onClick={onAddAll}
            >
              Add all {suggestions.length}
            </Button>
          )}
        </Flex>

        {/* Suggestion cards */}
        {suggestions.length > 0 && (
          <Flex direction="column" gap={2}>
            {suggestions.map((suggestion) => {
            const operatorText = formatOperator(suggestion.operator);
            const valueText = formatValue(suggestion.value, suggestion.operator);

            return (
              <Box
                key={suggestion.id}
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                px={3}
                py={2}
                _hover={{ bg: 'gray.50', borderColor: 'blue.300' }}
                cursor="pointer"
                onClick={() => onAddSingle(suggestion)}
                transition="all 0.2s"
              >
                <Flex align="center" justify="space-between">
                  {/* Rule preview */}
                  <Flex align="center" gap={2} flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      {suggestion.propertyName}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {operatorText}
                    </Text>
                    {valueText && (
                      <Text fontSize="sm" fontWeight="medium" color="blue.600">
                        {valueText}
                      </Text>
                    )}
                  </Flex>

                  {/* Add button */}
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSingle(suggestion);
                    }}
                  >
                    <CheckIcon fontSize="small" style={{ marginRight: '4px' }} />
                    Add
                  </Button>
                </Flex>

                {/* Parent name */}
                <Text fontSize="xs" color="gray.500" mt={1}>
                  from {suggestion.parentName}
                </Text>
              </Box>
            );
          })}
          </Flex>
        )}
      </Box>
    </Portal>
  );
}
