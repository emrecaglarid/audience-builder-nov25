import { Box, Flex, Text, Input, Switch } from '@chakra-ui/react';
import type { EngagementDefinition } from '../../types/schema';

interface GoalsConversionPanelProps {
  isEnabled: boolean;
  valueSource: 'static' | 'property';
  staticValue: string;
  propertyId: string;
  currency: string;
  engagements: EngagementDefinition[];
  isReadOnly?: boolean; // Whether to render in read-only mode (no inputs/actions)
  onToggle: () => void;
  onValueSourceChange: (source: 'static' | 'property') => void;
  onStaticValueChange: (value: string) => void;
  onPropertyChange: (propertyId: string) => void;
  onCurrencyChange: (currency: string) => void;
}

export function GoalsConversionPanel({
  isEnabled,
  valueSource,
  staticValue,
  propertyId,
  currency,
  engagements,
  isReadOnly = false,
  onToggle,
  onValueSourceChange,
  onStaticValueChange,
  onPropertyChange,
  onCurrencyChange,
}: GoalsConversionPanelProps) {
  // Filter to numeric properties only from all engagements
  const numericProperties = engagements.flatMap(engagement =>
    engagement.properties
      .filter(p => p.dataType === 'number')
      .map(p => ({
        id: p.id,
        name: p.name,
        parentName: engagement.name,
      }))
  );

  return (
    <Box
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
    >
      {/* Header with toggle */}
      <Flex px={4} py={3} align="center" justify="space-between">
        <Text fontWeight="semibold" fontSize="md">
          Track conversion value
        </Text>
        {isReadOnly ? (
          <Text fontSize="sm" color={isEnabled ? 'green.600' : 'gray.500'}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        ) : (
          <Switch.Root
            checked={isEnabled}
            onCheckedChange={() => onToggle()}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        )}
      </Flex>

      {/* Expanded content when enabled */}
      {isEnabled && (
        <Box px={4} py={3} borderTop="1px solid" borderColor="gray.200">
          {isReadOnly ? (
            /* Read-only display */
            <Flex gap={4} align="center">
              <Box>
                <Text fontSize="xs" color="gray.500" mb={0.5}>Value source</Text>
                <Text fontSize="sm" color="gray.700">
                  {valueSource === 'static' ? 'Static value' : 'From property'}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={0.5}>Value</Text>
                <Text fontSize="sm" color="gray.700">
                  {valueSource === 'static'
                    ? staticValue || '—'
                    : numericProperties.find(p => p.id === propertyId)
                      ? `${numericProperties.find(p => p.id === propertyId)?.parentName} → ${numericProperties.find(p => p.id === propertyId)?.name}`
                      : '—'
                  }
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" mb={0.5}>Currency</Text>
                <Text fontSize="sm" color="gray.700">{currency}</Text>
              </Box>
            </Flex>
          ) : (
            /* Editable controls */
            <Flex gap={4} align="flex-end">
              {/* Value source selector */}
              <Box w="160px">
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Value source
                </Text>
                <select
                  value={valueSource}
                  onChange={(e) => onValueSourceChange(e.target.value as 'static' | 'property')}
                  style={{
                    width: '100%',
                    fontSize: '14px',
                    borderWidth: '1px',
                    borderColor: '#E2E8F0',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="static">Static value</option>
                  <option value="property">From property</option>
                </select>
              </Box>

              {/* Static value input OR property selector */}
              <Box flex={1}>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Value
                </Text>
                {valueSource === 'static' ? (
                  <Input
                    type="number"
                    value={staticValue}
                    onChange={(e) => onStaticValueChange(e.target.value)}
                    placeholder="0.00"
                    size="sm"
                  />
                ) : (
                  <select
                    value={propertyId}
                    onChange={(e) => onPropertyChange(e.target.value)}
                    style={{
                      width: '100%',
                      fontSize: '14px',
                      borderWidth: '1px',
                      borderColor: '#E2E8F0',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select property</option>
                    {numericProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.parentName} → {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </Box>

              {/* Currency selector */}
              <Box w="120px">
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Currency
                </Text>
                <select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '14px',
                    borderWidth: '1px',
                    borderColor: '#E2E8F0',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CHF">CHF (Fr)</option>
                </select>
              </Box>
            </Flex>
          )}
        </Box>
      )}
    </Box>
  );
}
