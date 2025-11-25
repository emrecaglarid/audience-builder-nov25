/**
 * Audience Time-Series Data Generator
 * Generates historical audience flow data based on rules and customer data
 */

import type { Customer } from '@/types';
import type { MatchType, TimePeriod } from '@/components/AudienceBuilder/CriteriaSection';

// Import types for items array
interface AddedRule {
  id: string;
  propertyId: string;
  operator?: string;
  value?: any;
  disabled?: boolean;
}

interface RuleGroup {
  id: string;
  type: 'group';
  matchType: MatchType;
  rules: AddedRule[];
}

// Type guard to check if an item is a RuleGroup
function isRuleGroup(item: AddedRule | RuleGroup): item is RuleGroup {
  return 'type' in item && item.type === 'group';
}

export interface SectionConfig {
  id: string;
  title: string;
  items: (AddedRule | RuleGroup)[];
  matchType: MatchType;
  timePeriod: TimePeriod;
  isCollapsed: boolean;
}

export interface DailySnapshot {
  date: string; // YYYY-MM-DD
  entered: number; // Profiles that entered on this day
  active: number; // Total active profiles on this day
  exited: number; // Profiles that exited on this day
  goals: {
    [goalId: string]: {
      completions: number; // Number of goal completions on this day
      totalValue: number; // Sum of goal values (e.g., total revenue)
      avgValue: number; // Average goal value
    };
  };
}

export interface TimeSeriesData {
  daily: DailySnapshot[];
  summary: {
    totalEntered: number;
    totalExited: number;
    currentActive: number;
    netGrowth: number;
    netGrowthPercent: number;
    goals: {
      [goalId: string]: {
        name: string;
        totalCompletions: number;
        completionRate: number; // % of active profiles who completed
        totalValue: number;
        avgValue: number;
        trend: number; // % change vs previous period
      };
    };
  };
}

/**
 * Generate time-series data for audience analytics
 */
export function generateTimeSeriesData(
  sections: SectionConfig[],
  customers: Customer[],
  dateRange: { start: Date; end: Date },
  previousPeriodRange?: { start: Date; end: Date }
): TimeSeriesData {
  // Find relevant sections
  const entrySection = sections.find(s => s.id === 'entry');
  const goalsSection = sections.find(s => s.id === 'goals');

  if (!entrySection) {
    // Return empty data if no entry section
    return {
      daily: [],
      summary: {
        totalEntered: 0,
        totalExited: 0,
        currentActive: 0,
        netGrowth: 0,
        netGrowthPercent: 0,
        goals: {},
      },
    };
  }

  // Generate daily snapshots
  const daily: DailySnapshot[] = [];
  const currentDate = new Date(dateRange.start);

  while (currentDate <= dateRange.end) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Simulate customer state at this point in time
    // For simplicity, we'll use mock logic here
    // In production, you'd evaluate rules against historical data

    const entered = Math.floor(Math.random() * 50) + 10; // 10-60 entries per day
    const exited = Math.floor(Math.random() * 30) + 5;   // 5-35 exits per day
    const active = Math.floor(Math.random() * 500) + 2000; // 2000-2500 active

    // Mock goal data
    const goals: DailySnapshot['goals'] = {};
    if (goalsSection && goalsSection.items.length > 0) {
      // Filter out groups, only process rules
      const goalRules = goalsSection.items.filter(item => !isRuleGroup(item)) as AddedRule[];
      goalRules.forEach((_rule, index) => {
        const completions = Math.floor(Math.random() * 20) + 5;
        const avgValue = Math.floor(Math.random() * 150) + 50; // $50-$200
        goals[`goal-${index}`] = {
          completions,
          totalValue: completions * avgValue,
          avgValue,
        };
      });
    }

    daily.push({
      date: dateStr,
      entered,
      active,
      exited,
      goals,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate summary metrics
  const totalEntered = daily.reduce((sum, day) => sum + day.entered, 0);
  const totalExited = daily.reduce((sum, day) => sum + day.exited, 0);
  const currentActive = daily[daily.length - 1]?.active || 0;
  const netGrowth = totalEntered - totalExited;

  // Calculate net growth percent (vs previous period if provided)
  let netGrowthPercent = 0;
  if (previousPeriodRange) {
    const prevData = generateTimeSeriesData(sections, customers, previousPeriodRange);
    const prevNetGrowth = prevData.summary.netGrowth;
    if (prevNetGrowth !== 0) {
      netGrowthPercent = ((netGrowth - prevNetGrowth) / Math.abs(prevNetGrowth)) * 100;
    }
  }

  // Aggregate goal data
  const goalsSummary: TimeSeriesData['summary']['goals'] = {};
  if (goalsSection && goalsSection.items.length > 0) {
    // Filter out groups, only process rules
    const goalRules = goalsSection.items.filter(item => !isRuleGroup(item)) as AddedRule[];
    goalRules.forEach((rule, index) => {
      const goalId = `goal-${index}`;
      const goalData = daily.map(d => d.goals[goalId]).filter(Boolean);

      const totalCompletions = goalData.reduce((sum, g) => sum + g.completions, 0);
      const totalValue = goalData.reduce((sum, g) => sum + g.totalValue, 0);
      const avgValue = totalCompletions > 0 ? totalValue / totalCompletions : 0;
      const completionRate = currentActive > 0 ? (totalCompletions / currentActive) * 100 : 0;

      // Calculate trend vs previous period
      let trend = 0;
      if (previousPeriodRange) {
        const prevData = generateTimeSeriesData(sections, customers, previousPeriodRange);
        const prevGoalData = prevData.summary.goals[goalId];
        if (prevGoalData && prevGoalData.totalCompletions > 0) {
          trend = ((totalCompletions - prevGoalData.totalCompletions) / prevGoalData.totalCompletions) * 100;
        }
      }

      goalsSummary[goalId] = {
        name: rule.propertyName || `Goal ${index + 1}`,
        totalCompletions,
        completionRate,
        totalValue,
        avgValue,
        trend,
      };
    });
  }

  return {
    daily,
    summary: {
      totalEntered,
      totalExited,
      currentActive,
      netGrowth,
      netGrowthPercent,
      goals: goalsSummary,
    },
  };
}

/**
 * Get date range for a given period
 */
export function getDateRangeForPeriod(period: 'last7days' | 'last30days' | 'last90days' | 'custom', customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  let start: Date;

  switch (period) {
    case 'last7days':
      start = new Date(end);
      start.setDate(start.getDate() - 7);
      break;
    case 'last30days':
      start = new Date(end);
      start.setDate(start.getDate() - 30);
      break;
    case 'last90days':
      start = new Date(end);
      start.setDate(start.getDate() - 90);
      break;
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      // Fallback to last 30 days
      start = new Date(end);
      start.setDate(start.getDate() - 30);
      break;
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}

/**
 * Get previous period range (same duration as current period)
 */
export function getPreviousPeriodRange(currentRange: { start: Date; end: Date }): { start: Date; end: Date } {
  const duration = currentRange.end.getTime() - currentRange.start.getTime();

  const end = new Date(currentRange.start);
  end.setMilliseconds(-1); // Just before current period starts

  const start = new Date(end);
  start.setTime(start.getTime() - duration);

  return { start, end };
}
