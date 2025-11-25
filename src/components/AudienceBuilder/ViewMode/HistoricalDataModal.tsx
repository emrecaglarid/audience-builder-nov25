import { Box, Button, Input, Text, VStack, Dialog } from '@chakra-ui/react';
import { useState } from 'react';
import { isBefore, isValid } from 'date-fns';

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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Validation: both dates required and start < end
  const isValidRange = (): boolean => {
    if (!startDate || !endDate) return false;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return (
      isValid(start) &&
      isValid(end) &&
      isBefore(start, end)
    );
  };

  const handleLoadClick = () => {
    if (isValidRange()) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      onLoadData(start, end);
      // Reset form
      setStartDate('');
      setEndDate('');
    }
  };

  const handleClose = () => {
    // Reset form on close
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
                Select a date range to load historical performance data for this audience.
              </Text>

              {/* Start Date */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                  Start Date
                </Text>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
              </Box>

              {/* End Date */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                  End Date
                </Text>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </Box>

              {/* Validation message */}
              {startDate && endDate && !isValidRange() && (
                <Text fontSize="xs" color="red.600">
                  Start date must be before end date
                </Text>
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
              disabled={!isValidRange()}
            >
              Load Data
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
