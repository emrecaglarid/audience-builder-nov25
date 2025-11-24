/**
 * Central export for all types
 */

export type { DataType, PropertyDefinition, FactDefinition, EngagementDefinition, IndustrySchema, PropertyReference } from './schema'

export type { CustomerFacts, EngagementProperties, Engagement, Customer } from './customer'

export type {
  ComparisonOperator,
  DateOperator,
  TimeWindow,
  AggregationFunction,
  LogicalOperator,
  FactCondition,
  EngagementCondition,
  ConditionGroup,
  Condition,
} from './query'

export { isConditionGroup, isFactCondition, isEngagementCondition } from './query'

export type { Audience, AudienceListItem } from './audience'
