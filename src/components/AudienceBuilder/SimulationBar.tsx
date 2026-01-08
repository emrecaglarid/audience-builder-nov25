import { Flex, Text, Spinner, Switch } from '@chakra-ui/react';

interface SimulationBarProps {
  matchingProfiles: number;
  showRuleCounts: boolean;
  onToggleRuleCounts: () => void;
  isCalculating?: boolean;
}

// Format large numbers (e.g., 1200, 1.2K, 1.2M)
const formatCount = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
};

export function SimulationBar({
  matchingProfiles,
  showRuleCounts,
  onToggleRuleCounts,
  isCalculating = false,
}: SimulationBarProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      px={4}
      py={2}
      gap={4}
    >
      {/* Left: Estimated size */}
      <Flex align="center" gap={1}>
        <Text fontSize="sm" color="gray.500">
          Estimated size:
        </Text>
        <Text
          fontSize="xl"
          fontWeight="bold"
          color="gray.800"
          opacity={isCalculating ? 0.5 : 1}
          transition="opacity 0.2s"
        >
          {formatCount(matchingProfiles)} profiles
        </Text>
        {isCalculating && <Spinner size="xs" color="purple.500" ml={1} />}
      </Flex>

      {/* Right: Show Breakdown toggle */}
      <Flex align="center" gap={2}>
        <Text fontSize="sm" color="gray.500">
          Show breakdown
        </Text>
        <Switch.Root
          checked={showRuleCounts}
          onCheckedChange={onToggleRuleCounts}
          size="sm"
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Root>
      </Flex>
    </Flex>
  );
}

export default SimulationBar;
