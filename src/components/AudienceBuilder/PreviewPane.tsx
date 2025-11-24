import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export type PreviewTimePeriod = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'allTime';

interface PreviewPaneProps {
  matchingProfiles: number;
  reachedGoals: number;
  timePeriod: PreviewTimePeriod;
  onTimePeriodChange: (period: PreviewTimePeriod) => void;
  hasGoals?: boolean;
  hasExitConditions?: boolean;
}

const TIME_PERIOD_LABELS: Record<PreviewTimePeriod, string> = {
  'last7days': 'Last 7 days',
  'last30days': 'Last 30 days',
  'last90days': 'Last 90 days',
  'lastYear': 'Last year',
  'allTime': 'All time',
};

export const PreviewPane = ({
  matchingProfiles,
  reachedGoals,
  timePeriod,
  onTimePeriodChange,
  hasGoals = false,
  hasExitConditions = false,
}: PreviewPaneProps) => {
  // Format large numbers (e.g., 1200, 1.2K, 1.2M)
  const formatCount = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Box
      width="320px"
      height="fit-content"
      flexShrink={0}
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        pb={2}
        mb={2}
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Text fontSize="md" fontWeight="semibold" color="gray.700">
          Simulate
        </Text>

        {/* Time period dropdown */}
        <Menu.Root positioning={{ placement: 'bottom-end', strategy: 'fixed' }}>
          <Menu.Trigger asChild>
            <Button
              size="xs"
              variant="ghost"
              colorScheme="gray"
            >
              {TIME_PERIOD_LABELS[timePeriod]}
              <ExpandMoreIcon fontSize="small" style={{ marginLeft: '4px' }} />
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="last7days" onClick={() => onTimePeriodChange('last7days')}>
                Last 7 days
              </Menu.Item>
              <Menu.Item value="last30days" onClick={() => onTimePeriodChange('last30days')}>
                Last 30 days
              </Menu.Item>
              <Menu.Item value="last90days" onClick={() => onTimePeriodChange('last90days')}>
                Last 90 days
              </Menu.Item>
              <Menu.Item value="lastYear" onClick={() => onTimePeriodChange('lastYear')}>
                Last year
              </Menu.Item>
              <Menu.Item value="allTime" onClick={() => onTimePeriodChange('allTime')}>
                All time
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Flex>

      {/* Content - Metrics with dividers */}
      <Box>
        {/* Matching profiles - always show */}
        <Flex
          justify="space-between"
          align="center"
          py={2}
          borderBottom={hasGoals || hasExitConditions ? "1px solid" : "none"}
          borderColor="gray.200"
        >
          <Text fontSize="sm" color="gray.600">
            Matching profiles
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="gray.800">
            {formatCount(matchingProfiles)}
          </Text>
        </Flex>

        {/* Reached goals - only show if goals section has rules */}
        {hasGoals && (
          <Flex
            justify="space-between"
            align="center"
            py={2}
            borderBottom={hasExitConditions ? "1px solid" : "none"}
            borderColor="gray.200"
          >
            <Text fontSize="sm" color="gray.600">
              Reached goals
            </Text>
            <Text fontSize="xl" fontWeight="semibold" color="gray.800">
              {formatCount(reachedGoals)}
            </Text>
          </Flex>
        )}

        {/* Exit audience - only show if exit section has rules */}
        {hasExitConditions && (
          <Flex
            justify="space-between"
            align="center"
            py={2}
          >
            <Text fontSize="sm" color="gray.600">
              Exit audience
            </Text>
            <Text fontSize="xl" fontWeight="semibold" color="gray.800">
              {formatCount(0)}
            </Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default PreviewPane;
