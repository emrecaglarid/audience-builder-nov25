import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RuleRow } from './RuleRow';
import { RuleGroup } from './RuleGroup';
import { CriteriaSearchInput } from './CriteriaSearchInput';
import type { PropertyDefinition, FactDefinition, EngagementDefinition } from '../../types/schema';
import type { PropertyMatch } from './PropertyDropdown';
import type { AISuggestion } from './aiSuggestions';

export type MatchType = 'all' | 'any';
export type TimePeriod = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'allTime' | 'customRange';

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
  shouldFocusInput?: boolean;
  isActive?: boolean;
  isInSelectionMode?: boolean;
  selectedRuleIds?: Set<string>;
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
  onAddProperty: (match: PropertyMatch) => void;
  onAddAISuggestions: (suggestions: AISuggestion[]) => void;
  onEnterSelectionMode: () => void;
  onExitSelectionMode: () => void;
  onToggleRuleSelection: (ruleId: string) => void;
  onGroupSelected: () => void;
  onUngroupGroup: (groupId: string) => void;
  onGroupMatchTypeChange: (groupId: string, matchType: MatchType) => void;
  onRenameGroup: (groupId: string, name: string) => void;
  onToggleCollapse?: () => void;
  onSetActive?: () => void;
}

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  'last7days': 'in the last 7 days',
  'last30days': 'in the last 30 days',
  'last90days': 'in the last 90 days',
  'lastYear': 'in the last year',
  'allTime': 'all time',
  'customRange': 'custom range',
};

export const CriteriaSection = ({
  sectionId,
  title,
  items,
  matchType,
  timePeriod,
  isCollapsed = false,
  shouldFocusInput = false,
  isActive = false,
  isInSelectionMode = false,
  selectedRuleIds = new Set(),
  facts,
  engagements,
  onMatchTypeChange,
  onTimePeriodChange,
  onRuleDelete,
  onRuleChange,
  onRuleToggleExcluded,
  onRuleToggleDisabled,
  onRuleCommentChange,
  onRuleTrackVariableChange,
  onAddProperty,
  onAddAISuggestions,
  onEnterSelectionMode,
  onExitSelectionMode,
  onToggleRuleSelection,
  onGroupSelected,
  onUngroupGroup,
  onGroupMatchTypeChange,
  onRenameGroup,
  onToggleCollapse,
  onSetActive,
}: CriteriaSectionProps) => {
  // Extract only AddedRule items for display count (not groups)
  const rules = items.filter(item => !isRuleGroup(item)) as AddedRule[];

  // Set up droppable for this section
  const { setNodeRef, isOver } = useDroppable({
    id: sectionId,
    data: {
      type: 'section',
      sectionId,
    },
  });

  return (
    <Box
      ref={setNodeRef}
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor={isActive ? 'blue.500' : (isOver ? 'blue.400' : 'gray.200')}
      overflow="hidden"
      mb={4}
      boxShadow={isActive ? '0 0 0 3px rgba(66, 153, 225, 0.15)' : (isOver ? 'lg' : 'none')}
      transition="all 0.2s"
      cursor="pointer"
      onClick={onSetActive}
    >
      {/* Section Header */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={3}
        borderBottom={!isCollapsed && rules.length > 0 ? '1px solid' : 'none'}
        borderColor="gray.200"
        cursor="pointer"
        onClick={onToggleCollapse}
        _hover={{ bg: 'gray.50' }}
      >
        {/* Left side: Collapse icon + Title */}
        <Flex align="center" gap={2}>
          {/* Collapse icon */}
          {isCollapsed ? (
            <ChevronRightIcon fontSize="small" style={{ color: '#718096' }} />
          ) : (
            <ExpandMoreIcon fontSize="small" style={{ color: '#718096' }} />
          )}

          {/* Title */}
          <Text fontSize="md" fontWeight="semibold" color="gray.700">
            {title}
          </Text>
        </Flex>

        {/* Right side: Dropdowns */}
        {!isCollapsed && (
          <Flex align="center" gap={2} onClick={(e) => e.stopPropagation()}>
            {/* Match type dropdown - only show when 2+ rules */}
            {rules.length >= 2 && (
              <Menu.Root positioning={{ placement: 'bottom-start', strategy: 'fixed' }}>
                <Menu.Trigger asChild>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                  >
                    {matchType === 'all' ? 'all the rules below match' : 'any of the rules below match'}
                    <ExpandMoreIcon fontSize="small" style={{ marginLeft: '4px' }} />
                  </Button>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item
                      value="all"
                      onClick={() => onMatchTypeChange('all')}
                    >
                      all the rules below match
                    </Menu.Item>
                    <Menu.Item
                      value="any"
                      onClick={() => onMatchTypeChange('any')}
                    >
                      any of the rules below match
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Item
                      value="group-rules"
                      onClick={onEnterSelectionMode}
                    >
                      Group rules...
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            )}

            {/* Time period dropdown */}
            <Menu.Root positioning={{ placement: 'bottom-start', strategy: 'fixed' }}>
              <Menu.Trigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                >
                  {TIME_PERIOD_LABELS[timePeriod]}
                  <ExpandMoreIcon fontSize="small" style={{ marginLeft: '4px' }} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="last7days" onClick={() => onTimePeriodChange('last7days')}>
                    in the last 7 days
                  </Menu.Item>
                  <Menu.Item value="last30days" onClick={() => onTimePeriodChange('last30days')}>
                    in the last 30 days
                  </Menu.Item>
                  <Menu.Item value="last90days" onClick={() => onTimePeriodChange('last90days')}>
                    in the last 90 days
                  </Menu.Item>
                  <Menu.Item value="lastYear" onClick={() => onTimePeriodChange('lastYear')}>
                    in the last year
                  </Menu.Item>
                  <Menu.Item value="allTime" onClick={() => onTimePeriodChange('allTime')}>
                    all time
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          </Flex>
        )}
      </Flex>

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
            <SortableContext
              items={items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Box>
                {items.map((item) => {
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
                        engagements={engagements}
                        onMatchTypeChange={(matchType) => onGroupMatchTypeChange(item.id, matchType)}
                        onRuleDelete={onRuleDelete}
                        onRuleChange={onRuleChange}
                        onRuleToggleExcluded={onRuleToggleExcluded}
                        onRuleToggleDisabled={onRuleToggleDisabled}
                        onRuleCommentChange={onRuleCommentChange}
                        onRuleTrackVariableChange={onRuleTrackVariableChange}
                        onUngroup={() => onUngroupGroup(item.id)}
                        onRename={(name) => onRenameGroup(item.id, name)}
                      />
                    );
                  }

                  // Render rule
                  return (
                    <RuleRow
                      key={item.id}
                      ruleId={item.id}
                      ruleName={item.propertyName}
                      parentName={item.parentName}
                      properties={item.properties}
                      preSelectedProperty={item.propertyId}
                      excluded={item.excluded}
                      disabled={item.disabled}
                      comment={item.comment}
                      trackVariable={item.trackVariable}
                      sectionId={sectionId}
                      isInSelectionMode={isInSelectionMode}
                      isSelected={selectedRuleIds.has(item.id)}
                      onDelete={() => onRuleDelete(item.id)}
                      onChange={(data) => onRuleChange(item.id, data)}
                      onToggleExcluded={() => onRuleToggleExcluded(item.id)}
                      onToggleDisabled={() => onRuleToggleDisabled(item.id)}
                      onCommentChange={(comment) => onRuleCommentChange(item.id, comment)}
                      onTrackVariableChange={(variable) => onRuleTrackVariableChange(item.id, variable)}
                      onToggleSelection={() => onToggleRuleSelection(item.id)}
                    />
                  );
                })}
              </Box>
            </SortableContext>
          )}

          {/* Add criteria input */}
          <CriteriaSearchInput
            sectionTitle={title}
            sectionId={sectionId}
            facts={facts}
            engagements={engagements}
            shouldFocus={shouldFocusInput}
            hasAnyRules={rules.length > 0}
            onAddProperty={onAddProperty}
            onAddAISuggestions={onAddAISuggestions}
          />
        </>
      )}
    </Box>
  );
};
