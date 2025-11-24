/**
 * Query and condition types
 */

export type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'isTrue'
  | 'isFalse'

export type DateOperator =
  | 'before'
  | 'after'
  | 'between'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'lastYear'
  | 'allTime'
  | 'customRange'

export type TimeWindow =
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'lastYear'
  | 'allTime'
  | 'customRange'

export type AggregationFunction = 'count' | 'sum' | 'avg' | 'min' | 'max'

export type LogicalOperator = 'AND' | 'OR'

export interface FactCondition {
  type: 'fact'
  field: string // fact ID (e.g., "client", "policyMetrics")
  property: string // property ID (e.g., "agent_id", "coverage_amount")
  operator: ComparisonOperator | DateOperator
  value: string | number | boolean | Date | [Date, Date] | [number, number]
}

export interface EngagementCondition {
  type: 'engagement'
  engagement: string // engagement ID
  property?: string // property ID (optional for count)
  operator: ComparisonOperator | DateOperator
  value: string | number | boolean | Date | [Date, Date] | [number, number]
  timeWindow: TimeWindow
  aggregation?: AggregationFunction
}

export interface ConditionGroup {
  operator: LogicalOperator
  conditions: (FactCondition | EngagementCondition | ConditionGroup)[]
}

export type Condition = FactCondition | EngagementCondition | ConditionGroup

export function isConditionGroup(condition: Condition): condition is ConditionGroup {
  return 'operator' in condition && 'conditions' in condition
}

export function isFactCondition(condition: Condition): condition is FactCondition {
  return 'type' in condition && condition.type === 'fact'
}

export function isEngagementCondition(condition: Condition): condition is EngagementCondition {
  return 'type' in condition && condition.type === 'engagement'
}
