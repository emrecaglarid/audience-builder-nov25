import type { PropertyDefinition } from '@/types';

// Rule interface (matching AudienceBuilderPage)
interface AddedRule {
  id: string;
  propertyId: string;
  propertyName: string;
  parentName: string;
  properties: PropertyDefinition[];
  operator?: string;
  value?: string | number | boolean;
  value2?: string | number;
  excluded?: boolean;
  disabled?: boolean;
  comment?: string;
  trackVariable?: string;
}

// Destination interface (matching destination types)
interface AddedDestination {
  id: string;
  platformType: string;
  platformName: string;
  accountId: string;
  accountName: string;
  trafficPercentage?: number;
  targetAudienceName?: string;
  disabled?: boolean;
  status?: string;
}

type MatchType = 'all' | 'any';
type TimePeriod = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'allTime' | 'customRange';

// Operator labels for natural language
const OPERATOR_LABELS: Record<string, string> = {
  equals: 'equals',
  notEquals: 'does not equal',
  contains: 'contains',
  notContains: 'does not contain',
  startsWith: 'starts with',
  endsWith: 'ends with',
  greaterThan: 'is greater than',
  lessThan: 'is less than',
  greaterThanOrEqual: 'is at least',
  lessThanOrEqual: 'is at most',
  between: 'is between',
  isTrue: 'is true',
  isFalse: 'is false',
  before: 'is before',
  after: 'is after',
  last7days: 'in the last 7 days',
  last30days: 'in the last 30 days',
  last90days: 'in the last 90 days',
  lastYear: 'in the last year',
  allTime: 'all time',
};

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  last7days: 'in the last 7 days',
  last30days: 'in the last 30 days',
  last90days: 'in the last 90 days',
  lastYear: 'in the last year',
  allTime: 'all time',
  customRange: 'in custom range',
};

/**
 * Convert a rule to a human-readable sentence
 */
export function ruleToSentence(rule: AddedRule): string {
  const prefix = rule.excluded ? 'Exclude if' : '';
  const propertyName = rule.propertyName;
  const operatorLabel = rule.operator ? OPERATOR_LABELS[rule.operator] || rule.operator : '';

  // Handle operators that don't need values
  if (rule.operator === 'isTrue' || rule.operator === 'isFalse') {
    return `${prefix} ${propertyName} ${operatorLabel}`.trim();
  }

  // Handle time-based operators
  if (rule.operator?.startsWith('last') || rule.operator === 'allTime') {
    return `${prefix} ${propertyName} ${operatorLabel}`.trim();
  }

  // Handle between operator
  if (rule.operator === 'between' && rule.value !== undefined && rule.value2 !== undefined) {
    return `${prefix} ${propertyName} ${operatorLabel} ${rule.value} and ${rule.value2}`.trim();
  }

  // Standard operators with values
  if (rule.value !== undefined) {
    const valueStr = typeof rule.value === 'boolean' ? (rule.value ? 'true' : 'false') : rule.value;
    return `${prefix} ${propertyName} ${operatorLabel} ${valueStr}`.trim();
  }

  // Incomplete rule - just show property name
  return `${prefix} ${propertyName}`.trim();
}

/**
 * Generate a summary for a section
 */
export function sectionToSummary(
  title: string,
  rules: AddedRule[],
  matchType: MatchType,
  timePeriod: TimePeriod
): string {
  if (rules.length === 0) {
    return `${title} (no rules)`;
  }

  const matchTypeLabel = matchType === 'all' ? 'all of' : 'any of';
  const timeLabel = TIME_PERIOD_LABELS[timePeriod];

  return `${title} ${matchTypeLabel} the following ${timeLabel}`;
}

/**
 * Convert sync destinations to a human-readable summary
 */
export function destinationsToSentence(
  destinations: AddedDestination[],
  experimentMode: boolean
): string {
  if (destinations.length === 0) {
    return 'No destinations configured';
  }

  if (destinations.length === 1) {
    const dest = destinations[0];
    const audienceName = dest.targetAudienceName || 'audience';
    return `Syncing to ${dest.platformName} (${dest.accountName}) as "${audienceName}"`;
  }

  // Multiple destinations
  if (experimentMode) {
    const destList = destinations
      .map(d => {
        const audienceName = d.targetAudienceName || 'audience';
        return `${d.platformName} (${d.accountName}) "${audienceName}" - ${d.trafficPercentage || 0}%`;
      })
      .join(', ');
    return `Experiment mode: ${destList}`;
  } else {
    const destList = destinations
      .map(d => {
        const audienceName = d.targetAudienceName || 'audience';
        return `${d.platformName} (${d.accountName}) as "${audienceName}"`;
      })
      .join(', ');
    return `Syncing to ${destList}`;
  }
}
