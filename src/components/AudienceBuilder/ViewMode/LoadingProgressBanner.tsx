import { Box, Button, Flex, Text, Spinner } from '@chakra-ui/react';

interface LoadingProgressBannerProps {
  progress: number; // 0-100
  onCancel: () => void;
}

export const LoadingProgressBanner = ({
  progress,
  onCancel,
}: LoadingProgressBannerProps) => {
  return (
    <Box
      bg="orange.50"
      border="1px solid"
      borderColor="orange.200"
      borderRadius="lg"
      p={4}
      mb={6}
    >
      <Flex align="center" justify="space-between" gap={4}>
        <Flex align="center" gap={3} flex="1">
          <Spinner size="sm" color="orange.600" />
          <Text fontSize="sm" color="orange.900" fontWeight="medium">
            Loading historical data... {Math.round(progress)}%
          </Text>
        </Flex>
        <Button
          variant="outline"
          colorScheme="orange"
          size="sm"
          onClick={onCancel}
          flexShrink={0}
        >
          Cancel
        </Button>
      </Flex>
    </Box>
  );
};
