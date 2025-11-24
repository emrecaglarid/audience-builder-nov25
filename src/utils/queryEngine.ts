/**
 * Query Engine - Evaluates conditions against customer data
 */

import {
  Customer,
  Condition,
  ConditionGroup,
  FactCondition,
  EngagementCondition,
  ComparisonOperator,
  DateOperator,
  TimeWindow,
  AggregationFunction,
  isConditionGroup,
  isFactCondition,
  isEngagementCondition,
} from '@/types'

// Time window helpers
function getTimeWindowDate(timeWindow: TimeWindow): Date | null {
  const now = new Date()

  switch (timeWindow) {
    case 'last7days':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'last30days':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case 'last90days':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'lastYear':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    case 'allTime':
      return null
    case 'customRange':
      return null // Custom range handled separately
    default:
      return null
  }
}

// Value comparison helpers
function compareValues(
  value1: string | number | boolean | Date,
  operator: ComparisonOperator | DateOperator,
  value2: string | number | boolean | Date | [Date, Date] | [number, number]
): boolean {
  // Handle date operators
  if (operator === 'before' && value1 instanceof Date && value2 instanceof Date) {
    return value1 < value2
  }
  if (operator === 'after' && value1 instanceof Date && value2 instanceof Date) {
    return value1 > value2
  }
  if (operator === 'between') {
    if (Array.isArray(value2)) {
      if (value1 instanceof Date && value2[0] instanceof Date && value2[1] instanceof Date) {
        return value1 >= value2[0] && value1 <= value2[1]
      }
      if (typeof value1 === 'number' && typeof value2[0] === 'number' && typeof value2[1] === 'number') {
        return value1 >= value2[0] && value1 <= value2[1]
      }
    }
    return false
  }

  // Handle time-based operators (last7days, last30days, etc.)
  if (['last7days', 'last30days', 'last90days', 'lastYear'].includes(operator)) {
    if (value1 instanceof Date) {
      const windowDate = getTimeWindowDate(operator as TimeWindow)
      return windowDate ? value1 >= windowDate : true
    }
    return false
  }

  // String comparisons
  if (typeof value1 === 'string' && typeof value2 === 'string') {
    switch (operator) {
      case 'equals':
        return value1 === value2
      case 'notEquals':
        return value1 !== value2
      case 'contains':
        return value1.toLowerCase().includes(value2.toLowerCase())
      case 'startsWith':
        return value1.toLowerCase().startsWith(value2.toLowerCase())
      case 'endsWith':
        return value1.toLowerCase().endsWith(value2.toLowerCase())
      default:
        return false
    }
  }

  // Number comparisons
  if (typeof value1 === 'number' && typeof value2 === 'number') {
    switch (operator) {
      case 'equals':
        return value1 === value2
      case 'notEquals':
        return value1 !== value2
      case 'greaterThan':
        return value1 > value2
      case 'lessThan':
        return value1 < value2
      case 'greaterThanOrEqual':
        return value1 >= value2
      case 'lessThanOrEqual':
        return value1 <= value2
      default:
        return false
    }
  }

  // Boolean comparisons
  if (typeof value1 === 'boolean') {
    if (operator === 'isTrue') return value1 === true
    if (operator === 'isFalse') return value1 === false
    if (operator === 'equals') return value1 === value2
    if (operator === 'notEquals') return value1 !== value2
  }

  return false
}

// Evaluate fact condition
function evaluateFactCondition(customer: Customer, condition: FactCondition): boolean {
  // Facts are now nested objects, so we need to access fact[property]
  const factObject = customer.facts[condition.field]

  if (!factObject || typeof factObject !== 'object') {
    return false
  }

  const factValue = factObject[condition.property]

  if (factValue === undefined || factValue === null) {
    return false
  }

  // Convert date strings to Date objects if needed
  let processedValue = factValue
  let processedConditionValue = condition.value

  if (typeof factValue === 'string' && factValue.match(/^\d{4}-\d{2}-\d{2}T/)) {
    processedValue = new Date(factValue)
  }

  if (typeof condition.value === 'string' && condition.value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    processedConditionValue = new Date(condition.value)
  }

  if (Array.isArray(condition.value) && condition.value.length === 2) {
    const [firstValue, secondValue] = condition.value
    if (typeof firstValue === 'string' && typeof secondValue === 'string') {
      const datePattern = /^\d{4}-\d{2}-\d{2}T/
      if (datePattern.test(firstValue)) {
        processedConditionValue = [new Date(firstValue), new Date(secondValue)]
      }
    }
  }

  return compareValues(processedValue, condition.operator, processedConditionValue)
}

// Aggregate function helpers
function applyAggregation(
  values: (string | number | boolean | Date)[],
  aggregation?: AggregationFunction
): number {
  if (!aggregation || aggregation === 'count') {
    return values.length
  }

  const numericValues = values.filter(v => typeof v === 'number') as number[]

  switch (aggregation) {
    case 'sum':
      return numericValues.reduce((sum, val) => sum + val, 0)
    case 'avg':
      return numericValues.length > 0
        ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
        : 0
    case 'min':
      return numericValues.length > 0 ? Math.min(...numericValues) : 0
    case 'max':
      return numericValues.length > 0 ? Math.max(...numericValues) : 0
    default:
      return values.length
  }
}

// Evaluate engagement condition
function evaluateEngagementCondition(
  customer: Customer,
  condition: EngagementCondition
): boolean {
  // Filter engagements by type
  let relevantEngagements = customer.engagements.filter(
    (engagement) => engagement.type === condition.engagement
  )

  // Apply time window filter
  if (condition.timeWindow && condition.timeWindow !== 'allTime') {
    const windowDate = getTimeWindowDate(condition.timeWindow)
    if (windowDate) {
      relevantEngagements = relevantEngagements.filter((engagement) => {
        const engagementDate = new Date(engagement.timestamp)
        return engagementDate >= windowDate
      })
    }
  }

  // If no property specified, just count engagements
  if (!condition.property) {
    const count = relevantEngagements.length
    return compareValues(count, condition.operator, condition.value as number)
  }

  // Extract property values from engagements
  const propertyValues = relevantEngagements
    .map((engagement) => engagement.properties[condition.property!])
    .filter((val) => val !== undefined && val !== null)

  if (propertyValues.length === 0) {
    return false
  }

  // If aggregation is specified, apply it
  if (condition.aggregation) {
    const aggregatedValue = applyAggregation(propertyValues, condition.aggregation)
    return compareValues(aggregatedValue, condition.operator, condition.value as number)
  }

  // Otherwise, check if any engagement matches the condition
  return propertyValues.some((value) => {
    // Convert date strings to Date objects if needed
    let processedValue = value
    let processedConditionValue = condition.value

    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      processedValue = new Date(value)
    }

    if (typeof condition.value === 'string' && condition.value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      processedConditionValue = new Date(condition.value)
    }

    return compareValues(processedValue, condition.operator, processedConditionValue)
  })
}

// Recursively evaluate condition group
function evaluateConditionGroup(customer: Customer, group: ConditionGroup): boolean {
  if (group.conditions.length === 0) {
    return true
  }

  const results = group.conditions.map((condition) => {
    if (isConditionGroup(condition)) {
      return evaluateConditionGroup(customer, condition)
    } else if (isFactCondition(condition)) {
      return evaluateFactCondition(customer, condition)
    } else if (isEngagementCondition(condition)) {
      return evaluateEngagementCondition(customer, condition)
    }
    return false
  })

  if (group.operator === 'AND') {
    return results.every((result) => result === true)
  } else {
    // OR
    return results.some((result) => result === true)
  }
}

// Main evaluation function
export function evaluateCondition(customer: Customer, condition: Condition): boolean {
  if (isConditionGroup(condition)) {
    return evaluateConditionGroup(customer, condition)
  } else if (isFactCondition(condition)) {
    return evaluateFactCondition(customer, condition)
  } else if (isEngagementCondition(condition)) {
    return evaluateEngagementCondition(customer, condition)
  }
  return false
}

// Filter customers by conditions
export function filterCustomers(
  customers: Customer[],
  conditions: ConditionGroup
): Customer[] {
  return customers.filter((customer) => evaluateConditionGroup(customer, conditions))
}

// Calculate audience size
export function calculateAudienceSize(
  customers: Customer[],
  conditions: ConditionGroup
): number {
  return filterCustomers(customers, conditions).length
}
