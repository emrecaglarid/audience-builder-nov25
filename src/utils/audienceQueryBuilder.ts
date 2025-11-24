import type { ConditionGroup, FactCondition, EngagementCondition, TimeWindow } from '@/types/query';
import type { FactDefinition, EngagementDefinition, PropertyDefinition, DataType } from '@/types/schema';

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

interface SectionConfig {
  id: string;
  title: string;
  rules: AddedRule[];
  matchType: 'all' | 'any';
  timePeriod: string;
  isCollapsed: boolean;
}

interface SchemaData {
  facts: FactDefinition[];
  engagements: EngagementDefinition[];
}

/**
 * Operators that don't require a value
 */
function isValuelessOperator(operator: string): boolean {
  return ['isTrue', 'isFalse', 'last7days', 'last30days', 'last90days', 'lastYear', 'allTime'].includes(operator);
}

/**
 * Check if a rule is complete (has operator and value if needed) and not disabled
 */
function isRuleComplete(rule: AddedRule): boolean {
  // Skip disabled rules
  if (rule.disabled) return false;

  if (!rule.operator) return false;
  if (isValuelessOperator(rule.operator)) return true;
  return rule.value !== undefined && rule.value !== '';
}

/**
 * Convert value to appropriate type based on dataType
 */
function convertValue(value: any, dataType: DataType): any {
  if (value === undefined || value === null) return value;

  switch (dataType) {
    case 'number':
      return typeof value === 'string' ? parseFloat(value) : value;
    case 'boolean':
      return value === 'true' || value === true;
    case 'date':
      return typeof value === 'string' ? new Date(value) : value;
    default:
      return value; // string
  }
}

/**
 * Determine if a parent is an engagement (vs a fact)
 */
function isEngagement(parentName: string, schema: SchemaData): boolean {
  return schema.engagements.some(e => e.name === parentName || e.id === parentName);
}

/**
 * Find the parent definition (fact or engagement) by name
 */
function findParent(parentName: string, schema: SchemaData): FactDefinition | EngagementDefinition | undefined {
  return [...schema.facts, ...schema.engagements].find(p => p.name === parentName || p.id === parentName);
}

/**
 * Get property definition for a rule
 */
function getPropertyDef(rule: AddedRule): PropertyDefinition | undefined {
  return rule.properties.find(p => p.id === rule.propertyId);
}

/**
 * Convert time period string to TimeWindow
 */
function convertTimeWindow(timePeriod: string): TimeWindow {
  switch (timePeriod) {
    case 'last7days': return 'last7days';
    case 'last30days': return 'last30days';
    case 'last90days': return 'last90days';
    case 'lastYear': return 'lastYear';
    case 'allTime': return 'allTime';
    default: return 'last30days'; // Default fallback
  }
}

/**
 * Convert a single rule to a Fact or Engagement condition
 */
function ruleToCondition(
  rule: AddedRule,
  section: SectionConfig,
  schema: SchemaData
): FactCondition | EngagementCondition | null {
  const parent = findParent(rule.parentName, schema);
  if (!parent) {
    console.warn(`Parent not found: ${rule.parentName}`);
    return null;
  }

  const propertyDef = getPropertyDef(rule);
  if (!propertyDef) {
    console.warn(`Property not found: ${rule.propertyId}`);
    return null;
  }

  const operator = rule.operator!;
  const dataType = propertyDef.dataType;

  // Convert value to proper type
  let value: any = convertValue(rule.value, dataType);

  // Handle between operator (requires value2)
  if (operator === 'between' && rule.value2 !== undefined) {
    const value2 = convertValue(rule.value2, dataType);
    value = [value, value2];
  }

  // Check if it's an engagement
  if (isEngagement(rule.parentName, schema)) {
    const engagementCondition: EngagementCondition = {
      type: 'engagement',
      engagement: parent.id,
      property: rule.propertyId,
      operator: operator as any,
      value,
      timeWindow: convertTimeWindow(section.timePeriod),
    };
    return engagementCondition;
  } else {
    // It's a fact
    const factCondition: FactCondition = {
      type: 'fact',
      field: parent.id,
      property: rule.propertyId,
      operator: operator as any,
      value,
    };
    return factCondition;
  }
}

/**
 * Convert a section to a ConditionGroup
 */
function sectionToConditionGroup(
  section: SectionConfig,
  schema: SchemaData
): ConditionGroup | null {
  // Filter to only complete rules (excludes disabled rules)
  const completeRules = section.rules.filter(isRuleComplete);

  if (completeRules.length === 0) {
    return null; // No complete rules in this section
  }

  // Separate excluded and included rules
  const includedRules = completeRules.filter(rule => !rule.excluded);
  const excludedRules = completeRules.filter(rule => rule.excluded);

  // Convert included rules to conditions
  const includedConditions = includedRules
    .map(rule => ruleToCondition(rule, section, schema))
    .filter((c): c is FactCondition | EngagementCondition => c !== null);

  // Convert excluded rules to conditions (will be wrapped in NOT)
  const excludedConditions = excludedRules
    .map(rule => ruleToCondition(rule, section, schema))
    .filter((c): c is FactCondition | EngagementCondition => c !== null);

  // Build the final condition list
  const allConditions: Array<FactCondition | EngagementCondition | ConditionGroup> = [];

  // Add included conditions directly
  allConditions.push(...includedConditions);

  // Wrap excluded conditions in an AND group
  // Note: Excluded conditions will be handled by the query engine using negation
  if (excludedConditions.length > 0) {
    allConditions.push({
      operator: 'AND',
      conditions: excludedConditions,
    });
  }

  if (allConditions.length === 0) {
    return null; // No valid conditions
  }

  return {
    operator: section.matchType === 'all' ? 'AND' : 'OR',
    conditions: allConditions,
  };
}

/**
 * Convert sections configuration to a ConditionGroup for the query engine
 */
export function sectionsToConditionGroup(
  sections: SectionConfig[],
  schema: SchemaData
): ConditionGroup {
  // Only consider entry section for now (other sections like goals, exit are not part of the filter)
  const entrySection = sections.find(s => s.id === 'entry');

  if (!entrySection) {
    // No entry section, return empty condition (matches all)
    return {
      operator: 'AND',
      conditions: [],
    };
  }

  const entrySectionConditions = sectionToConditionGroup(entrySection, schema);

  if (!entrySectionConditions || entrySectionConditions.conditions.length === 0) {
    // No conditions, return empty (matches all)
    return {
      operator: 'AND',
      conditions: [],
    };
  }

  return entrySectionConditions;
}
