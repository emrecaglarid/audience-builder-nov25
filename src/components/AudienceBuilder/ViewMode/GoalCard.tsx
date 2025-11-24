import { Box, Text, Flex, VStack } from '@chakra-ui/react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface GoalCardProps {
  goalName: string;
  completions: number;
  completionRate: number; // percentage
  totalValue?: number;
  avgValue?: number;
  trend?: number; // percentage change vs previous period
  sparklineData?: number[]; // Last 7 days data for mini chart
}

export const GoalCard = ({
  goalName,
  completions,
  completionRate,
  totalValue,
  avgValue,
  trend,
  sparklineData = [],
}: GoalCardProps) => {
  const trendColor = trend && trend > 0 ? 'green.600' : trend && trend < 0 ? 'red.600' : 'gray.600';
  const TrendIcon = trend && trend > 0 ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Box
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      p={5}
      flex="1"
      minWidth="300px"
    >
      <Flex justify="space-between" align="flex-start" mb={3}>
        <VStack align="flex-start" gap={0}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            {goalName}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {completionRate.toFixed(1)}% completion rate
          </Text>
        </VStack>

        {trend !== undefined && trend !== 0 && (
          <Flex
            align="center"
            gap={0.5}
            px={2}
            py={0.5}
            bg={trend > 0 ? 'green.50' : 'red.50'}
            borderRadius="md"
          >
            <TrendIcon fontSize="inherit" style={{ fontSize: '12px' }} />
            <Text fontSize="xs" fontWeight="semibold" color={trendColor}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </Text>
          </Flex>
        )}
      </Flex>

      {/* Main metrics */}
      <Flex gap={4} mb={3}>
        <Box flex="1">
          <Text fontSize="xs" color="gray.600" mb={0.5}>
            Total completions
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="purple.600">
            {completions.toLocaleString()}
          </Text>
        </Box>

        {totalValue !== undefined && (
          <Box flex="1">
            <Text fontSize="xs" color="gray.600" mb={0.5}>
              Total value
            </Text>
            <Text fontSize="lg" fontWeight="semibold" color="gray.800">
              ${totalValue.toLocaleString()}
            </Text>
          </Box>
        )}
      </Flex>

      {/* Average value */}
      {avgValue !== undefined && (
        <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="gray.100">
          <Text fontSize="xs" color="gray.600">
            Avg value per completion
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            ${avgValue.toFixed(2)}
          </Text>
        </Flex>
      )}

      {/* Sparkline - Last 7 days trend */}
      {sparklineData.length > 0 && (
        <Box mt={3} height="40px">
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={sparklineData.map((value, index) => ({ day: index, value }))}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#805AD5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};
