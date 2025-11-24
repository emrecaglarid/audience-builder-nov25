import { Box, Flex, Text } from '@chakra-ui/react';
import { Checkbox } from '@chakra-ui/react';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DailySnapshot } from '@/utils/audienceTimeSeries';

interface AudienceChartProps {
  data: DailySnapshot[];
  goalNames?: { [goalId: string]: string };
}

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  enabled: boolean;
}

export const AudienceChart = ({ data, goalNames = {} }: AudienceChartProps) => {
  // Initialize metric configurations
  const initialMetrics: MetricConfig[] = [
    { key: 'entered', label: 'Entered', color: '#48BB78', enabled: true },
    { key: 'active', label: 'Active', color: '#805AD5', enabled: true },
    { key: 'exited', label: 'Exited', color: '#F56565', enabled: true },
  ];

  // Add goal metrics
  Object.keys(goalNames).forEach((goalId, index) => {
    const colors = ['#3182CE', '#DD6B20', '#38B2AC', '#D69E2E']; // Different colors for goals
    initialMetrics.push({
      key: `goals.${goalId}.completions`,
      label: goalNames[goalId],
      color: colors[index % colors.length],
      enabled: false, // Goals disabled by default to avoid cluttering
    });
  });

  const [metrics, setMetrics] = useState<MetricConfig[]>(initialMetrics);

  const toggleMetric = (key: string) => {
    setMetrics(prev =>
      prev.map(m => (m.key === key ? { ...m, enabled: !m.enabled } : m))
    );
  };

  // Transform data for Recharts
  const chartData = data.map(day => {
    const result: any = {
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: day.date,
      entered: day.entered,
      active: day.active,
      exited: day.exited,
    };

    // Add goal data
    Object.keys(day.goals || {}).forEach(goalId => {
      result[`goal_${goalId}_completions`] = day.goals[goalId].completions;
    });

    return result;
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <Box bg="white" p={3} borderRadius="md" border="1px solid" borderColor="gray.200" boxShadow="lg">
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          {label}
        </Text>
        {payload.map((entry: any, index: number) => (
          <Flex key={index} justify="space-between" gap={4} mb={1}>
            <Flex align="center" gap={2}>
              <Box w="10px" h="10px" borderRadius="full" bg={entry.color} />
              <Text fontSize="xs" color="gray.700">
                {entry.name}:
              </Text>
            </Flex>
            <Text fontSize="xs" fontWeight="semibold" color="gray.900">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </Text>
          </Flex>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      {/* Metric toggles */}
      <Flex gap={4} mb={4} flexWrap="wrap">
        {metrics.map(metric => (
          <Checkbox.Root
            key={metric.key}
            checked={metric.enabled}
            onCheckedChange={() => toggleMetric(metric.key)}
            size="sm"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>
              <Flex align="center" gap={2}>
                <Box w="12px" h="12px" borderRadius="sm" bg={metric.color} />
                <Text fontSize="sm" color="gray.700">
                  {metric.label}
                </Text>
              </Flex>
            </Checkbox.Label>
          </Checkbox.Root>
        ))}
      </Flex>

      {/* Chart */}
      <Box height="400px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#718096' }}
              tickLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#718096' }}
              tickLine={{ stroke: '#E2E8F0' }}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />

            {/* Render enabled metrics */}
            {metrics
              .filter(m => m.enabled)
              .map(metric => {
                // Handle nested goal data keys
                const dataKey = metric.key.includes('goals.')
                  ? metric.key.replace('goals.', 'goal_').replace('.completions', '_completions')
                  : metric.key;

                return (
                  <Line
                    key={metric.key}
                    type="monotone"
                    dataKey={dataKey}
                    stroke={metric.color}
                    strokeWidth={2}
                    name={metric.label}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};
