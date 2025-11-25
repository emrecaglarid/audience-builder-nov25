import { Box, Text, VStack, Flex, Button } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Customer } from '@/types';
import { AddedDestination } from '@/types/destination';
import { KPICard } from './KPICard';
import { GoalCard } from './GoalCard';
import { AudienceChart } from './AudienceChart';
import { SyncActivationSection } from './SyncActivationSection';
import { SupermetricsIntegration } from './SupermetricsIntegration';
import { HistoricalDataBanner } from './HistoricalDataBanner';
import { LoadingProgressBanner } from './LoadingProgressBanner';
import { SuccessBanner } from './SuccessBanner';
import {
  generateTimeSeriesData,
  getDateRangeForPeriod,
  getPreviousPeriodRange,
  type SectionConfig,
} from '@/utils/audienceTimeSeries';

interface DashboardProps {
  matchingProfiles: number;
  sections?: SectionConfig[];
  customers?: Customer[];
  syncDestinations?: AddedDestination[];
  experimentMode?: boolean;
  hasHistoricalData?: boolean;
  isLoadingData?: boolean;
  loadingProgress?: number;
  showSuccessBanner?: boolean;
  onLoadHistoricalData?: () => void;
  onCancelLoading?: () => void;
  onDismissSuccess?: () => void;
}

type DateRangePeriod = 'last7days' | 'last30days' | 'last90days' | 'custom';

const DATE_RANGE_LABELS: Record<DateRangePeriod, string> = {
  last7days: 'Last 7 days',
  last30days: 'Last 30 days',
  last90days: 'Last 90 days',
  custom: 'Custom range',
};

export const Dashboard = ({
  sections = [],
  customers = [],
  syncDestinations = [],
  experimentMode = false,
  hasHistoricalData = false,
  isLoadingData = false,
  loadingProgress = 0,
  showSuccessBanner = false,
  onLoadHistoricalData,
  onCancelLoading,
  onDismissSuccess,
}: DashboardProps) => {
  const [dateRange, setDateRange] = useState<DateRangePeriod>('last30days');

  // Generate time-series data (only when historical data is loaded)
  const timeSeriesData = useMemo(() => {
    if (!hasHistoricalData) {
      // Return empty data structure when no historical data
      return {
        daily: [],
        summary: {
          currentActive: 0,
          totalEntered: 0,
          totalExited: 0,
          netGrowth: 0,
          netGrowthPercent: 0,
          goals: {},
        },
      };
    }

    const currentRange = getDateRangeForPeriod(dateRange);
    const previousRange = getPreviousPeriodRange(currentRange);

    return generateTimeSeriesData(sections, customers, currentRange, previousRange);
  }, [sections, customers, dateRange, hasHistoricalData]);

  const { daily, summary } = timeSeriesData;

  // Get goal names for chart
  const goalNames = useMemo(() => {
    const names: { [key: string]: string } = {};
    Object.keys(summary.goals).forEach(goalId => {
      names[goalId] = summary.goals[goalId].name;
    });
    return names;
  }, [summary.goals]);

  // Get sparkline data for goals (last 7 days)
  const getGoalSparklineData = (goalId: string): number[] => {
    return daily.slice(-7).map(day => day.goals[goalId]?.completions || 0);
  };

  return (
    <Box
      flex="1"
      height="calc(100vh - 60px)"
      bg="#fbfbfb"
      overflowY="auto"
    >
      <VStack align="stretch" gap={6} pb={15}>
        {/* Banners */}
        {!hasHistoricalData && !isLoadingData && !showSuccessBanner && onLoadHistoricalData && (
          <HistoricalDataBanner onLoadClick={onLoadHistoricalData} />
        )}
        {isLoadingData && onCancelLoading && (
          <LoadingProgressBanner progress={loadingProgress} onCancel={onCancelLoading} />
        )}
        {showSuccessBanner && onDismissSuccess && (
          <SuccessBanner onDismiss={onDismissSuccess} />
        )}

        {/* Date Range Selector */}
        <Flex justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            Audience performance
          </Text>

          <Menu.Root positioning={{ placement: 'bottom-end', strategy: 'fixed' }}>
            <Menu.Trigger asChild>
              <Button size="sm" variant="outline" colorScheme="gray">
                {DATE_RANGE_LABELS[dateRange]}
                <ExpandMoreIcon fontSize="small" style={{ marginLeft: '4px' }} />
              </Button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item value="last7days" onClick={() => setDateRange('last7days')}>
                  Last 7 days
                </Menu.Item>
                <Menu.Item value="last30days" onClick={() => setDateRange('last30days')}>
                  Last 30 days
                </Menu.Item>
                <Menu.Item value="last90days" onClick={() => setDateRange('last90days')}>
                  Last 90 days
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Flex>

        {/* KPI Cards Row */}
        <Flex gap={4}>
          <KPICard
            label="Active Profiles"
            value={summary.currentActive}
            color="purple.600"
          />
          <KPICard
            label="Entered"
            value={summary.totalEntered}
            trend={summary.netGrowthPercent}
            color="green.600"
          />
          <KPICard
            label="Exited"
            value={summary.totalExited}
            color="red.600"
          />
          <KPICard
            label="Net Growth"
            value={summary.netGrowth}
            trend={summary.netGrowthPercent}
            color={summary.netGrowth >= 0 ? 'green.600' : 'red.600'}
            formatValue={(val) => {
              const num = typeof val === 'number' ? val : parseInt(val as string);
              return num >= 0 ? `+${num.toLocaleString()}` : num.toLocaleString();
            }}
          />
        </Flex>

        {/* Main Chart */}
        <Box>
          <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={4}>
            Audience Flow Over Time
          </Text>
          <Box
            bg="white"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            p={6}
          >
            <AudienceChart data={daily} goalNames={goalNames} />
          </Box>
        </Box>

        {/* Goal Cards */}
        {Object.keys(summary.goals).length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={4}>
              Goal Performance
            </Text>
            <Flex gap={4} flexWrap="wrap">
              {Object.entries(summary.goals).map(([goalId, goalData]) => (
                <GoalCard
                  key={goalId}
                  goalName={goalData.name}
                  completions={goalData.totalCompletions}
                  completionRate={goalData.completionRate}
                  totalValue={goalData.totalValue}
                  avgValue={goalData.avgValue}
                  trend={goalData.trend}
                  sparklineData={getGoalSparklineData(goalId)}
                />
              ))}
            </Flex>
          </Box>
        )}

        {/* Placeholder for future features */}
        {Object.keys(summary.goals).length === 0 && (
          <Box
            bg="white"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            p={6}
            height="200px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <VStack gap={2}>
              <Text fontSize="sm" color="gray.400">
                No goals defined yet
              </Text>
              <Text fontSize="xs" color="gray.400">
                Add goals to your audience to track performance
              </Text>
            </VStack>
          </Box>
        )}

        {/* Sync & Activation Section */}
        {syncDestinations.length > 0 && (
          <SyncActivationSection
            destinations={syncDestinations}
            experimentMode={experimentMode}
            currentAudienceSize={summary.currentActive}
          />
        )}

        {/* Supermetrics Integration */}
        {syncDestinations.length > 0 && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" color="gray.700" mb={4}>
              Track ROI in Supermetrics
            </Text>
            <SupermetricsIntegration destinations={syncDestinations} />
          </Box>
        )}
      </VStack>
    </Box>
  );
};
