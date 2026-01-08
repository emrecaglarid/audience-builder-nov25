import { Box, Button, Flex, Input, Text, VStack, Dialog } from '@chakra-ui/react';
import { useState } from 'react';
import { isBefore, isValid, subDays, subMonths, startOfWeek, startOfMonth } from 'date-fns';

type DatePreset = 'lastWeek' | 'lastMonth' | 'last6Months' | 'custom';

const PRESET_LABELS: Record<DatePreset, string> = {
  lastWeek: 'Last week to date',
  lastMonth: 'Last month to date',
  last6Months: 'Last 6 months to date',
  custom: 'Custom',
};

interface HistoricalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadData: (startDate: Date, endDate: Date) => void;
}

export const HistoricalDataModal = ({
  isOpen,
  onClose,
  onLoadData,
}: HistoricalDataModalProps) => {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('lastWeek');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Calculate dates based on preset
  const getPresetDates = (preset: DatePreset): { start: Date; end: Date } | null => {
    const now = new Date();

    switch (preset) {
      case 'lastWeek':
        return {
          start: startOfWeek(subDays(now, 7)),
          end: now,
        };
      case 'lastMonth':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: now,
        };
      case 'last6Months':
        return {
          start: startOfMonth(subMonths(now, 6)),
          end: now,
        };
      case 'custom':
        return null;
    }
  };

  // Validation for custom dates
  const isValidCustomRange = (): boolean => {
    if (!startDate || !endDate) return false;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return (
      isValid(start) &&
      isValid(end) &&
      isBefore(start, end)
    );
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    if (selectedPreset === 'custom') {
      return isValidCustomRange();
    }
    return true; // Presets are always valid
  };

  const handleLoadClick = () => {
    if (selectedPreset === 'custom') {
      if (isValidCustomRange()) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        onLoadData(start, end);
      }
    } else {
      const dates = getPresetDates(selectedPreset);
      if (dates) {
        onLoadData(dates.start, dates.end);
      }
    }
    // Reset form
    setSelectedPreset('lastWeek');
    setStartDate('');
    setEndDate('');
  };

  const handleClose = () => {
    // Reset form on close
    setSelectedPreset('lastWeek');
    setStartDate('');
    setEndDate('');
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <Dialog.Backdrop bg="blackAlpha.600" />
      <Dialog.Positioner>
        <Dialog.Content maxW="500px">
          <Dialog.Header>
            <Dialog.Title>Load Historical Data</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>

          <Dialog.Body>
            <VStack align="stretch" gap={4}>
              <Text fontSize="sm" color="gray.600">
                Select a date range to load historical performance data.
              </Text>

              {/* Radio options */}
              <VStack align="stretch" gap={2}>
                {(['lastWeek', 'lastMonth', 'last6Months', 'custom'] as DatePreset[]).map((preset) => (
                  <Flex
                    key={preset}
                    align="center"
                    gap={3}
                    cursor="pointer"
                    onClick={() => setSelectedPreset(preset)}
                    py={1}
                    _hover={{ bg: 'gray.50' }}
                    borderRadius="md"
                    px={2}
                    mx={-2}
                  >
                    <Box
                      w="18px"
                      h="18px"
                      borderRadius="full"
                      border="2px solid"
                      borderColor={selectedPreset === preset ? 'blue.500' : 'gray.300'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      {selectedPreset === preset && (
                        <Box
                          w="10px"
                          h="10px"
                          borderRadius="full"
                          bg="blue.500"
                        />
                      )}
                    </Box>
                    <Text fontSize="sm" color="gray.700">
                      {PRESET_LABELS[preset]}
                    </Text>
                  </Flex>
                ))}
              </VStack>

              {/* Custom date inputs - only show when custom is selected */}
              {selectedPreset === 'custom' && (
                <VStack align="stretch" gap={3} pl={7} mt={2}>
                  {/* Start Date */}
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                      Start Date
                    </Text>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || undefined}
                      size="sm"
                    />
                  </Box>

                  {/* End Date */}
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                      End Date
                    </Text>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || undefined}
                      size="sm"
                    />
                  </Box>

                  {/* Validation message */}
                  {startDate && endDate && !isValidCustomRange() && (
                    <Text fontSize="xs" color="red.600">
                      Start date must be before end date
                    </Text>
                  )}
                </VStack>
              )}
            </VStack>
          </Dialog.Body>

          <Dialog.Footer gap={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleLoadClick}
              disabled={!isFormValid()}
            >
              Load Data
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
