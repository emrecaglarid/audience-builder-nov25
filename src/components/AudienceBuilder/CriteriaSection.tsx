import { Box, Flex, Text, Button } from '@chakra-ui/react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { RuleRow } from './RuleRow';
import { RuleGroup } from './RuleGroup';
import type { PropertyDefinition, FactDefinition, EngagementDefinition } from '../../types/schema';

export type MatchType = 'all' | 'any';
export type TimePeriod = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'allTime' | 'customRange' | 'perRule';

export interface AddedRule {
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
  timePeriod?: TimePeriod; // Per-rule time period (when perRule mode is enabled)
}

export interface RuleGroup {
  id: string;
  type: 'group';
  matchType: MatchType;
  rules: AddedRule[];
  collapsed?: boolean;
  name?: string;
}

// Type guard to check if an item is a RuleGroup
export function isRuleGroup(item: AddedRule | RuleGroup): item is RuleGroup {
  return 'type' in item && item.type === 'group';
}

interface CriteriaSectionProps {
  sectionId: string;
  title: string;
  items: (AddedRule | RuleGroup)[];
  matchType: MatchType;
  timePeriod: TimePeriod;
  isCollapsed?: boolean;
  isActive?: boolean;
  isInSelectionMode?: boolean;
  selectedRuleIds?: Set<string>;
  isEngagementsOnly?: boolean;
  showRuleCounts?: boolean;
  ruleCounts?: Record<string, number>;
  isReadOnly?: boolean; // Whether to render in read-only mode (no controls/actions)
  facts: FactDefinition[];
  engagements: EngagementDefinition[];
  onMatchTypeChange: (matchType: MatchType) => void;
  onTimePeriodChange: (timePeriod: TimePeriod) => void;
  onRuleDelete: (ruleId: string) => void;
  onRuleAdd: (propertyId: string) => void;
  onRuleChange: (ruleId: string, data: { property: string; operator: string; value: string | number | boolean }) => void;
  onRuleToggleExcluded: (ruleId: string) => void;
  onRuleToggleDisabled: (ruleId: string) => void;
  onRuleCommentChange: (ruleId: string, comment: string) => void;
  onRuleTrackVariableChange: (ruleId: string, variable: string) => void;
  onEnterSelectionMode: () => void;
  onExitSelectionMode: () => void;
  onToggleRuleSelection: (ruleId: string) => void;
  onGroupSelected: () => void;
  onUngroupGroup: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onGroupMatchTypeChange: (groupId: string, matchType: MatchType) => void;
  onRenameGroup: (groupId: string, name: string) => void;
  onRuleTimePeriodChange?: (ruleId: string, timePeriod: TimePeriod) => void;
  onToggleCollapse?: () => void;
  onSetActive?: () => void;
}

const SECTION_TITLES: Record<string, string> = {
  'entry': 'Entry criteria',
  'goals': 'Goal criteria',
  'exit': 'Exit criteria',
};

// Helper to check if a rule is an engagement (vs a fact)
function isEngagementRule(rule: AddedRule, facts: FactDefinition[]): boolean {
  // A rule is an engagement if its parent is NOT in the facts array
  return !facts.some(fact =>
    fact.name === rule.parentName || fact.id === rule.parentName
  );
}

export const CriteriaSection = ({
  sectionId,
  title,
  items,
  matchType,
  timePeriod: _timePeriod,
  isCollapsed = false,
  isActive = false,
  isInSelectionMode = false,
  selectedRuleIds = new Set(),
  isEngagementsOnly = false,
  showRuleCounts = false,
  ruleCounts = {},
  isReadOnly = false,
  facts,
  engagements: _engagements,
  onMatchTypeChange,
  onTimePeriodChange: _onTimePeriodChange,
  onRuleDelete,
  onRuleChange,
  onRuleToggleExcluded,
  onRuleToggleDisabled,
  onRuleCommentChange,
  onRuleTrackVariableChange,
  onEnterSelectionMode,
  onExitSelectionMode,
  onToggleRuleSelection,
  onGroupSelected,
  onUngroupGroup,
  onDeleteGroup,
  onGroupMatchTypeChange,
  onRenameGroup,
  onRuleTimePeriodChange,
  onToggleCollapse,
  onSetActive,
}: CriteriaSectionProps) => {
  return (
    <Box
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor={isActive ? 'blue.500' : 'gray.200'}
      overflow="visible"
      mb={4}
      boxShadow={isActive ? '0 0 0 3px rgba(66, 153, 225, 0.15)' : 'none'}
      transition="all 0.2s"
      cursor="pointer"
      onClick={onSetActive}
    >
      {/* Section Header */}
      <Box
        px={4}
        py={3}
        borderBottom={!isCollapsed && items.length > 0 ? '1px solid' : 'none'}
        borderColor="gray.200"
      >
        {/* Section title with inline controls */}
        <Flex align="center" gap={2}>
          {/* Collapse icon */}
          <Box
            cursor="pointer"
            onClick={onToggleCollapse}
            _hover={{ color: 'gray.600' }}
            color="gray.400"
          >
            {isCollapsed ? (
              <ChevronRightIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </Box>
          <Text fontWeight="semibold" fontSize="md" flex={1}>
            {SECTION_TITLES[sectionId] || title}
          </Text>

          {/* Inline controls - only show when there are rules, not collapsed, and not read-only */}
          {!isCollapsed && items.length > 0 && !isReadOnly && (
            <Flex align="center" gap={2} onClick={(e) => e.stopPropagation()}>
              {/* + Group button - show when 2+ items, before All/Any */}
              {items.length >= 2 && (
                <Button
                  size="xs"
                  variant="outline"
                  fontSize="xs"
                  h="24px"
                  px={2}
                  onClick={onEnterSelectionMode}
                >
                  + Group
                </Button>
              )}

              {/* All/Any segmented control - rightmost */}
              <Flex
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                overflow="hidden"
                fontSize="xs"
              >
                <Box
                  px={2}
                  py={1}
                  bg={matchType === 'all' ? 'gray.100' : 'white'}
                  cursor="pointer"
                  fontWeight={matchType === 'all' ? 'medium' : 'normal'}
                  onClick={() => onMatchTypeChange('all')}
                  _hover={{ bg: matchType === 'all' ? 'gray.100' : 'gray.50' }}
                >
                  All
                </Box>
                <Box
                  px={2}
                  py={1}
                  bg={matchType === 'any' ? 'gray.100' : 'white'}
                  borderLeft="1px solid"
                  borderColor="gray.200"
                  cursor="pointer"
                  fontWeight={matchType === 'any' ? 'medium' : 'normal'}
                  onClick={() => onMatchTypeChange('any')}
                  _hover={{ bg: matchType === 'any' ? 'gray.100' : 'gray.50' }}
                >
                  Any
                </Box>
              </Flex>
            </Flex>
          )}

          {/* Read-only: show match type as text */}
          {!isCollapsed && items.length > 0 && isReadOnly && (
            <Text fontSize="xs" color="gray.500">
              Match {matchType}
            </Text>
          )}
        </Flex>
      </Box>

      {/* Section Content */}
      {!isCollapsed && (
        <>
          {/* Selection mode header */}
          {isInSelectionMode && (
            <Flex
              align="center"
              justify="space-between"
              px={4}
              py={2}
              bg="blue.50"
              borderBottom="1px solid"
              borderColor="blue.200"
            >
              <Text fontSize="sm" color="blue.700" fontWeight="medium">
                Select rules to group ({selectedRuleIds.size} selected)
              </Text>
              <Flex gap={2}>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={onExitSelectionMode}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  colorScheme="blue"
                  onClick={onGroupSelected}
                  disabled={selectedRuleIds.size < 2}
                >
                  Group {selectedRuleIds.size} rules
                </Button>
              </Flex>
            </Flex>
          )}

          {/* Items list (rules + groups) */}
          {items.length > 0 && (
            <Box>
                {items.map((item, index) => {
                  // Render group
                  if (isRuleGroup(item)) {
                    return (
                      <RuleGroup
                        key={item.id}
                        groupId={item.id}
                        name={item.name}
                        matchType={item.matchType}
                        rules={item.rules}
                        isCollapsed={item.collapsed}
                        sectionId={sectionId}
                        facts={facts}
                        isEngagementsOnly={isEngagementsOnly}
                        isReadOnly={isReadOnly}
                        onMatchTypeChange={(matchType) => onGroupMatchTypeChange(item.id, matchType)}
                        onRuleDelete={onRuleDelete}
                        onRuleChange={onRuleChange}
                        onRuleToggleExcluded={onRuleToggleExcluded}
                        onRuleToggleDisabled={onRuleToggleDisabled}
                        onRuleCommentChange={onRuleCommentChange}
                        onRuleTrackVariableChange={onRuleTrackVariableChange}
                        onUngroup={() => onUngroupGroup(item.id)}
                        onDeleteGroup={onDeleteGroup ? () => onDeleteGroup(item.id) : undefined}
                        onRename={(name) => onRenameGroup(item.id, name)}
                        onRuleTimePeriodChange={onRuleTimePeriodChange}
                      />
                    );
                  }

                  // Render rule
                  // Check if this rule is an engagement (not a fact) - facts never show date ranges
                  const ruleIsEngagement = isEngagementRule(item, facts);

                  return (
                    <RuleRow
                      key={item.id}
                      ruleId={item.id}
                      ruleName={item.propertyName}
                      parentName={item.parentName}
                      properties={item.properties}
                      preSelectedProperty={item.propertyId}
                      initialOperator={item.operator}
                      initialValue={item.value}
                      excluded={item.excluded}
                      disabled={item.disabled}
                      comment={item.comment}
                      trackVariable={item.trackVariable}
                      sectionId={sectionId}
                      isInSelectionMode={isInSelectionMode}
                      isSelected={selectedRuleIds.has(item.id)}
                      isLast={index === items.length - 1}
                      showMatchCount={showRuleCounts}
                      matchCount={ruleCounts[item.id]}
                      isEngagement={ruleIsEngagement}
                      timePeriod={item.timePeriod}
                      isReadOnly={isReadOnly}
                      onDelete={() => onRuleDelete(item.id)}
                      onChange={(data) => onRuleChange(item.id, data)}
                      onToggleExcluded={() => onRuleToggleExcluded(item.id)}
                      onToggleDisabled={() => onRuleToggleDisabled(item.id)}
                      onCommentChange={(comment) => onRuleCommentChange(item.id, comment)}
                      onTrackVariableChange={(variable) => onRuleTrackVariableChange(item.id, variable)}
                      onToggleSelection={() => onToggleRuleSelection(item.id)}
                      onTimePeriodChange={onRuleTimePeriodChange ? (tp) => onRuleTimePeriodChange(item.id, tp) : undefined}
                    />
                  );
                })}
            </Box>
          )}

          {/* Empty state when no items */}
          {items.length === 0 && (
            <Box px={4} py={6} textAlign="center">
              <Text fontSize="sm" color="gray.500">
                No criteria added yet
              </Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
