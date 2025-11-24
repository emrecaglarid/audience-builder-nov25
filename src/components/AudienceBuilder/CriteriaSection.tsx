import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RuleRow } from './RuleRow';
import { CriteriaSearchInput } from './CriteriaSearchInput';
import type { PropertyDefinition, FactDefinition, EngagementDefinition } from '../../types/schema';
import type { PropertyMatch } from './PropertyDropdown';
import type { AISuggestion } from './aiSuggestions';

export type MatchType = 'all' | 'any';
export type TimePeriod = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'allTime' | 'customRange';

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

interface CriteriaSectionProps {
  sectionId: string;
  title: string;
  rules: AddedRule[];
  matchType: MatchType;
  timePeriod: TimePeriod;
  isCollapsed?: boolean;
  shouldFocusInput?: boolean;
  isActive?: boolean;
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
  rules,
  matchType,
  timePeriod,
  isCollapsed = false,
  shouldFocusInput = false,
  isActive = false,
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
  onToggleCollapse,
  onSetActive,
}: CriteriaSectionProps) => {

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
          {/* Rules table */}
          {rules.length > 0 && (
            <SortableContext
              items={rules.map(rule => rule.id)}
              strategy={verticalListSortingStrategy}
            >
              <Box>
                {rules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    ruleId={rule.id}
                    ruleName={rule.propertyName}
                    parentName={rule.parentName}
                    properties={rule.properties}
                    preSelectedProperty={rule.propertyId}
                    excluded={rule.excluded}
                    disabled={rule.disabled}
                    comment={rule.comment}
                    trackVariable={rule.trackVariable}
                    sectionId={sectionId}
                    onDelete={() => onRuleDelete(rule.id)}
                    onChange={(data) => onRuleChange(rule.id, data)}
                    onToggleExcluded={() => onRuleToggleExcluded(rule.id)}
                    onToggleDisabled={() => onRuleToggleDisabled(rule.id)}
                    onCommentChange={(comment) => onRuleCommentChange(rule.id, comment)}
                    onTrackVariableChange={(variable) => onRuleTrackVariableChange(rule.id, variable)}
                  />
                ))}
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
