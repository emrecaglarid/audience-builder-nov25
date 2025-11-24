import { Box, Text, Flex } from '@chakra-ui/react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface KPICardProps {
  label: string;
  value: number | string;
  trend?: number; // Percentage change vs previous period
  color?: string;
  formatValue?: (value: number | string) => string;
}

export const KPICard = ({
  label,
  value,
  trend,
  color = 'purple.600',
  formatValue,
}: KPICardProps) => {
  const displayValue = formatValue
    ? formatValue(value)
    : typeof value === 'number'
    ? value.toLocaleString()
    : value;

  const trendColor = trend && trend > 0 ? 'green.600' : trend && trend < 0 ? 'red.600' : 'gray.600';
  const TrendIcon = trend && trend > 0 ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Box
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      p={6}
      flex="1"
      position="relative"
    >
      <Text fontSize="sm" color="gray.600" mb={2}>
        {label}
      </Text>
      <Text fontSize="4xl" fontWeight="bold" color={color}>
        {displayValue}
      </Text>

      {trend !== undefined && trend !== 0 && (
        <Flex
          position="absolute"
          top={4}
          right={4}
          align="center"
          gap={0.5}
          px={2}
          py={0.5}
          bg={trend > 0 ? 'green.50' : 'red.50'}
          borderRadius="md"
        >
          <TrendIcon fontSize="inherit" style={{ fontSize: '14px', color: trendColor }} />
          <Text fontSize="xs" fontWeight="semibold" color={trendColor}>
            {Math.abs(trend).toFixed(1)}%
          </Text>
        </Flex>
      )}
    </Box>
  );
};
