import { Box, Flex, Text, Button, Input, IconButton } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RuleRow } from './RuleRow';
import type { AddedRule, MatchType } from './CriteriaSection';
import type { FactDefinition, EngagementDefinition } from '../../types/schema';

interface RuleGroupProps {
  groupId: string;
  name?: string;
  matchType: MatchType;
  rules: AddedRule[];
  isCollapsed?: boolean;
  sectionId: string;
  facts: FactDefinition[];
  engagements: EngagementDefinition[];
  onMatchTypeChange: (matchType: MatchType) => void;
  onRuleDelete: (ruleId: string) => void;
  onRuleChange: (ruleId: string, data: { property: string; operator: string; value: string | number | boolean }) => void;
  onRuleToggleExcluded: (ruleId: string) => void;
  onRuleToggleDisabled: (ruleId: string) => void;
  onRuleCommentChange: (ruleId: string, comment: string) => void;
  onRuleTrackVariableChange: (ruleId: string, variable: string) => void;
  onUngroup: () => void;
  onRename: (name: string) => void;
}

export function RuleGroup({
  groupId,
  name,
  matchType,
  rules,
  isCollapsed = false,
  sectionId,
  onMatchTypeChange,
  onRuleDelete,
  onRuleChange,
  onRuleToggleExcluded,
  onRuleToggleDisabled,
  onRuleCommentChange,
  onRuleTrackVariableChange,
  onUngroup,
  onRename,
}: RuleGroupProps) {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(name || 'Unnamed Group');

  // Set up sortable for the group itself
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: groupId,
    data: {
      dragType: 'group',
      groupId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  return (
    <Box
      ref={setNodeRef}
      style={style}
      ml={4}
      my={2}
      border="1px solid"
      borderColor="gray.300"
      borderRadius="md"
      bg="gray.50"
    >
      {/* Group Header */}
      <Flex
        align="center"
        justify="space-between"
        px={3}
        py={2}
        borderBottom={!collapsed ? '1px solid' : 'none'}
        borderColor="gray.200"
        bg="white"
        borderTopRadius="md"
      >
        {/* Left side: Drag handle + Collapse icon + Name */}
        <Flex align="center" gap={2}>
          {/* Drag handle */}
          <Box
            {...attributes}
            {...listeners}
            cursor="grab"
            display="flex"
            alignItems="center"
            color="gray.400"
            _hover={{ color: 'gray.600' }}
            style={{ touchAction: 'none' }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>

          {/* Collapse icon */}
          <IconButton
            aria-label={collapsed ? 'Expand group' : 'Collapse group'}
            size="xs"
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRightIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>

          {/* Group name (editable) */}
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
              fontWeight="semibold"
              color="gray.700"
              cursor="pointer"
              onClick={() => setIsEditingName(true)}
              _hover={{ color: 'blue.600' }}
            >
              {groupName}
            </Text>
          )}

          <Text fontSize="xs" color="gray.500">
            ({rules.length} {rules.length === 1 ? 'rule' : 'rules'})
          </Text>
        </Flex>

        {/* Right side: Match type dropdown + Actions menu */}
        <Flex align="center" gap={2}>
          {/* Match type dropdown */}
          {rules.length >= 2 && !collapsed && (
            <Menu.Root positioning={{ placement: 'bottom-start', strategy: 'fixed' }}>
              <Menu.Trigger asChild>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                >
                  {matchType === 'all' ? 'all' : 'any'}
                  <ExpandMoreIcon fontSize="small" style={{ marginLeft: '4px' }} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    value="all"
                    onClick={() => onMatchTypeChange('all')}
                  >
                    all rules match
                  </Menu.Item>
                  <Menu.Item
                    value="any"
                    onClick={() => onMatchTypeChange('any')}
                  >
                    any rule matches
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          )}

          {/* Actions menu */}
          <Menu.Root positioning={{ placement: 'bottom-end', strategy: 'fixed' }}>
            <Menu.Trigger asChild>
              <IconButton
                aria-label="Group actions"
                size="xs"
                variant="ghost"
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item
                  value="rename"
                  onClick={() => setIsEditingName(true)}
                >
                  Rename group
                </Menu.Item>
                <Menu.Item
                  value="ungroup"
                  onClick={onUngroup}
                >
                  Ungroup rules
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Flex>
      </Flex>

      {/* Group Content - Rules */}
      {!collapsed && (
        <Box bg="white" borderBottomRadius="md">
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
      )}
    </Box>
  );
}
