import { Box, Flex, Text, Input, IconButton } from '@chakra-ui/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import { useState } from 'react';
import { RuleRow } from './RuleRow';
import type { AddedRule, MatchType, TimePeriod } from './CriteriaSection';
import type { FactDefinition } from '../../types/schema';

// Helper to check if a rule is an engagement (vs a fact)
function isEngagementRule(rule: AddedRule, facts: FactDefinition[]): boolean {
  return !facts.some(fact =>
    fact.name === rule.parentName || fact.id === rule.parentName
  );
}

interface RuleGroupProps {
  groupId: string;
  name?: string;
  matchType: MatchType;
  rules: AddedRule[];
  isCollapsed?: boolean;
  sectionId: string;
  facts: FactDefinition[];
  isEngagementsOnly?: boolean;
  isReadOnly?: boolean; // Whether to render in read-only mode (no controls/actions)
  onMatchTypeChange: (matchType: MatchType) => void;
  onRuleDelete: (ruleId: string) => void;
  onRuleChange: (ruleId: string, data: { property: string; operator: string; value: string | number | boolean }) => void;
  onRuleToggleExcluded: (ruleId: string) => void;
  onRuleToggleDisabled: (ruleId: string) => void;
  onRuleCommentChange: (ruleId: string, comment: string) => void;
  onRuleTrackVariableChange: (ruleId: string, variable: string) => void;
  onUngroup: () => void;
  onDeleteGroup?: () => void;
  onRename: (name: string) => void;
  onRuleTimePeriodChange?: (ruleId: string, timePeriod: TimePeriod) => void;
}

export function RuleGroup({
  groupId: _groupId,
  name,
  matchType,
  rules,
  isCollapsed = false,
  sectionId,
  facts,
  isEngagementsOnly: _isEngagementsOnly = false,
  isReadOnly = false,
  onMatchTypeChange,
  onRuleDelete,
  onRuleChange,
  onRuleToggleExcluded,
  onRuleToggleDisabled,
  onRuleCommentChange,
  onRuleTrackVariableChange,
  onUngroup: _onUngroup,
  onDeleteGroup: _onDeleteGroup,
  onRename,
  onRuleTimePeriodChange,
}: RuleGroupProps) {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(name || 'Unnamed Group');

  const handleSaveName = () => {
    onRename(groupName);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setGroupName(name || 'Unnamed Group');
      setIsEditingName(false);
    }
  };

  // Collapsed view: minimal - just name and rule count
  if (collapsed) {
    return (
      <Flex
        align="center"
        gap={2}
        py={2}
        px={4}
        minH="48px"
        cursor="pointer"
        onClick={() => setCollapsed(false)}
        _hover={{ bg: 'gray.50' }}
      >
        {/* Chevron */}
        <Box
          color="gray.400"
          _hover={{ color: 'gray.600' }}
          flexShrink={0}
        >
          <ChevronRightIcon fontSize="small" />
        </Box>

        {/* Group name */}
        <Text
          fontSize="sm"
          fontWeight="medium"
          color="gray.700"
        >
          {groupName}
        </Text>

        {/* Rule count - right next to title */}
        <Text fontSize="xs" color="gray.500">
          • {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
        </Text>
      </Flex>
    );
  }

  // Expanded view
  return (
    <Box py={2} pl={4}>
      {/* Header row: chevron + name + edit icon + controls */}
      <Flex align="center" gap={2} mb={2} pr={4}>
        {/* Chevron */}
        <Box
          color="gray.400"
          cursor="pointer"
          onClick={() => setCollapsed(true)}
          _hover={{ color: 'gray.600' }}
          flexShrink={0}
        >
          <ExpandMoreIcon fontSize="small" />
        </Box>

        {/* Group name - editable via icon, no underline on hover */}
        {isEditingName ? (
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={handleKeyDown}
            size="sm"
            width="200px"
            autoFocus
          />
        ) : (
          <Text
            fontSize="sm"
            fontWeight="medium"
            color="gray.700"
          >
            {groupName}
          </Text>
        )}

        {/* Edit icon button for renaming - hide in read-only mode */}
        {!isEditingName && !isReadOnly && (
          <IconButton
            aria-label="Rename group"
            size="xs"
            variant="ghost"
            onClick={() => setIsEditingName(true)}
          >
            <EditIcon style={{ fontSize: '14px' }} />
          </IconButton>
        )}

        {/* Spacer */}
        <Box flex={1} />

        {/* All/Any segmented control - or text in read-only mode */}
        {isReadOnly ? (
          <Text fontSize="xs" color="gray.500">
            Match {matchType}
          </Text>
        ) : (
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
        )}
      </Flex>

      {/* Rules with vertical line on left edge */}
      <Box position="relative" ml={2}>
        {/* Vertical line aligned with chevron */}
        <Box
          position="absolute"
          left="0"
          top="0"
          bottom="0"
          width="1px"
          bg="gray.200"
        />

        {/* Rules */}
        <Box pl={4}>
          {rules.map((rule) => {
            // Determine if this rule is an engagement
            // Check if this rule is an engagement (not a fact) - facts never show date ranges
            const ruleIsEngagement = isEngagementRule(rule, facts);

            return (
              <RuleRow
                key={rule.id}
                ruleId={rule.id}
                ruleName={rule.propertyName}
                parentName={rule.parentName}
                properties={rule.properties}
                preSelectedProperty={rule.propertyId}
                initialOperator={rule.operator}
                initialValue={rule.value}
                excluded={rule.excluded}
                disabled={rule.disabled}
                comment={rule.comment}
                trackVariable={rule.trackVariable}
                sectionId={sectionId}
                isInGroup={true}
                isIndented={false}
                isEngagement={ruleIsEngagement}
                timePeriod={rule.timePeriod}
                isReadOnly={isReadOnly}
                onDelete={() => onRuleDelete(rule.id)}
                onChange={(data) => onRuleChange(rule.id, data)}
                onToggleExcluded={() => onRuleToggleExcluded(rule.id)}
                onToggleDisabled={() => onRuleToggleDisabled(rule.id)}
                onCommentChange={(comment) => onRuleCommentChange(rule.id, comment)}
                onTrackVariableChange={(variable) => onRuleTrackVariableChange(rule.id, variable)}
                onTimePeriodChange={onRuleTimePeriodChange ? (tp) => onRuleTimePeriodChange(rule.id, tp) : undefined}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
