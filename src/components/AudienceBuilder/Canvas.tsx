import { Box, Text, VStack, Flex, Button } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { CriteriaSection, MatchType, TimePeriod, type AddedRule, type RuleGroup } from './CriteriaSection';
import { CriteriaSearchInput } from './CriteriaSearchInput';
import { RuleRow } from './RuleRow';
import { SyncSection } from './SyncSection';
import { DestinationPickerModal } from './DestinationPickerModal';
import type { FactDefinition, EngagementDefinition } from '../../types/schema';
import type { PropertyMatch } from './PropertyDropdown';
import type { AISuggestion } from './aiSuggestions';
import type { AddedDestination, Destination } from '../../types/destination';

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  'last7days': 'in the last 7 days',
  'last30days': 'in the last 30 days',
  'last90days': 'in the last 90 days',
  'lastYear': 'in the last year',
  'allTime': 'all time',
  'customRange': 'custom range',
};

interface SectionConfig {
  id: string;
  title: string;
  items: (AddedRule | RuleGroup)[];
  matchType: MatchType;
  timePeriod: TimePeriod;
  isCollapsed: boolean;
}

interface CanvasProps {
  sections: SectionConfig[];
  facts: FactDefinition[];
  engagements: EngagementDefinition[];
  focusSectionId: string | null;
  activatedSections: Set<string>;
  activeSectionId: string;
  activeTab: 'define' | 'sync' | 'analyze';
  shouldSplitEntry?: boolean;
  entryFacts?: AddedRule[];
  entryEngagements?: AddedRule[];
  syncDestinations: AddedDestination[];
  experimentMode: boolean;
  isDestinationModalOpen: boolean;
  sectionSelectionMode: Record<string, boolean>;
  sectionSelectedRules: Record<string, Set<string>>;
  onSectionMatchTypeChange: (sectionId: string, matchType: MatchType) => void;
  onSectionTimePeriodChange: (sectionId: string, timePeriod: TimePeriod) => void;
  onSectionToggleCollapse: (sectionId: string) => void;
  onRuleDelete: (sectionId: string, ruleId: string) => void;
  onRuleAdd: (sectionId: string, propertyId: string) => void;
  onRuleChange: (sectionId: string, ruleId: string, data: { property: string; operator: string; value: string | number | boolean }) => void;
  onRuleToggleExcluded: (sectionId: string, ruleId: string) => void;
  onRuleToggleDisabled: (sectionId: string, ruleId: string) => void;
  onRuleCommentChange: (sectionId: string, ruleId: string, comment: string) => void;
  onRuleTrackVariableChange: (sectionId: string, ruleId: string, variable: string) => void;
  onAddSection: (sectionId: string) => void;
  onSetActiveSection: (sectionId: string) => void;
  onAddProperty: (sectionId: string, match: PropertyMatch) => void;
  onAddAISuggestions: (sectionId: string, suggestions: AISuggestion[]) => void;
  onEnterSelectionMode: (sectionId: string) => void;
  onExitSelectionMode: (sectionId: string) => void;
  onToggleRuleSelection: (sectionId: string, ruleId: string) => void;
  onGroupSelected: (sectionId: string) => void;
  onUngroupGroup: (sectionId: string, groupId: string) => void;
  onGroupMatchTypeChange: (sectionId: string, groupId: string, matchType: MatchType) => void;
  onRenameGroup: (sectionId: string, groupId: string, name: string) => void;
  onOpenDestinationModal: () => void;
  onCloseDestinationModal: () => void;
  onSelectDestination: (destination: Destination) => void;
  onDestinationDelete: (destinationId: string) => void;
  onDestinationTogglePaused: (destinationId: string) => void;
  onDestinationCommentChange: (destinationId: string, comment: string) => void;
  onDestinationPercentageChange: (destinationId: string, percentage: number, autoAdjust?: boolean) => void;
  onDestinationTargetAudienceChange: (destinationId: string, audienceName: string) => void;
  onExperimentToggle: () => void;
  onSplitEqually: () => void;
}

const sectionDescriptions: Record<string, string> = {
  goals: 'Track conversions and success metrics',
  sync: 'Connect to destinations and activation platforms',
  exit: 'Define when users leave this audience',
};

// Ghost section component with droppable functionality
interface GhostSectionProps {
  sectionId: string;
  title: string;
  description?: string;
  onAddSection: (sectionId: string) => void;
}

const GhostSection = ({ sectionId, title, description, onAddSection }: GhostSectionProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.100"
      px={4}
      py={3}
      cursor="pointer"
      onClick={(e) => {
        e.stopPropagation();
        onAddSection(sectionId);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      _hover={{ bg: 'gray.50' }}
      transition="all 0.2s"
    >
      <Flex align="center" gap={2}>
        <AddIcon fontSize="small" style={{ color: '#718096', fontSize: '18px' }} />
        <Text fontSize="md" color="gray.600" fontWeight="normal">
          {title}
          {isHovered && description && (
            <Text as="span" fontSize="sm" color="gray.500" ml={2}>
              {description}
            </Text>
          )}
        </Text>
      </Flex>
    </Box>
  );
};

export const Canvas = ({
  sections,
  facts,
  engagements,
  focusSectionId,
  activatedSections,
  activeSectionId,
  activeTab,
  shouldSplitEntry = false,
  entryFacts = [],
  entryEngagements = [],
  syncDestinations,
  experimentMode,
  isDestinationModalOpen,
  sectionSelectionMode,
  sectionSelectedRules,
  onSectionMatchTypeChange,
  onSectionTimePeriodChange,
  onSectionToggleCollapse,
  onRuleDelete,
  onRuleAdd,
  onRuleChange,
  onRuleToggleExcluded,
  onRuleToggleDisabled,
  onRuleCommentChange,
  onRuleTrackVariableChange,
  onAddSection,
  onSetActiveSection,
  onAddProperty,
  onAddAISuggestions,
  onEnterSelectionMode,
  onExitSelectionMode,
  onToggleRuleSelection,
  onGroupSelected,
  onUngroupGroup,
  onGroupMatchTypeChange,
  onRenameGroup,
  onOpenDestinationModal,
  onCloseDestinationModal,
  onSelectDestination,
  onDestinationDelete,
  onDestinationTogglePaused,
  onDestinationCommentChange,
  onDestinationPercentageChange,
  onDestinationTargetAudienceChange,
  onExperimentToggle,
  onSplitEqually,
}: CanvasProps) => {
  // Filter sections based on active tab
  const visibleSections = sections.filter(section => {
    if (activeTab === 'define') {
      // Define tab: show entry, goals, exit
      return section.id === 'entry' || section.id === 'goals' || section.id === 'exit';
    } else if (activeTab === 'sync') {
      // Sync tab: show only sync
      return section.id === 'sync';
    }
    return false;
  });

  // Check if any section has items (used to show/hide ghost sections)
  const hasAnyRules = visibleSections.some(section => section.items.length > 0);

  return (
    <Box
      width="100%"
      maxWidth="900px"
    >
      <VStack align="stretch" gap={4}>
        {visibleSections.map((section) => {
          // Special handling for entry section when split
          if (section.id === 'entry' && shouldSplitEntry) {
            return (
              <Box
                key={section.id}
                bg="white"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
                overflow="visible"
                mb={4}
              >
                {/* Main Entry Header */}
                <Flex
                  align="center"
                  px={4}
                  py={3}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontSize="md" fontWeight="semibold" color="gray.700">
                    {section.title}
                  </Text>
                </Flex>

                {/* Facts Subsection */}
                <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
                  <Flex align="center" justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Facts
                    </Text>
                    {entryFacts.length >= 2 && (
                      <Menu.Root positioning={{ placement: 'bottom-start', strategy: 'fixed' }}>
                        <Menu.Trigger asChild>
                          <Button size="xs" variant="ghost" colorScheme="blue">
                            {section.matchType === 'all' ? 'all the rules below match' : 'any of the rules below match'}
                            <ExpandMoreIcon fontSize="small" style={{ marginLeft: '4px' }} />
                          </Button>
                        </Menu.Trigger>
                        <Menu.Positioner>
                          <Menu.Content>
                            <Menu.Item value="all" onClick={() => onSectionMatchTypeChange(section.id, 'all')}>
                              all the rules below match
                            </Menu.Item>
                            <Menu.Item value="any" onClick={() => onSectionMatchTypeChange(section.id, 'any')}>
                              any of the rules below match
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Menu.Root>
                    )}
                  </Flex>
                  {entryFacts.map((rule) => (
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
                      sectionId="entry"
                      isInSelectionMode={false}
                      isSelected={false}
                      onDelete={() => onRuleDelete('entry', rule.id)}
                      onChange={(data) => onRuleChange('entry', rule.id, data)}
                      onToggleExcluded={() => onRuleToggleExcluded('entry', rule.id)}
                      onToggleDisabled={() => onRuleToggleDisabled('entry', rule.id)}
                      onCommentChange={(comment) => onRuleCommentChange('entry', rule.id, comment)}
                      onTrackVariableChange={(variable) => onRuleTrackVariableChange('entry', rule.id, variable)}
                      onToggleSelection={() => {}}
                    />
                  ))}
                </Box>

                {/* Engagements Subsection */}
                <Box px={4} py={3}>
                  <Flex align="center" justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                      Engagements
                    </Text>
                    <Flex align="center" gap={2}>
                      {entryEngagements.length >= 2 && (
                        <Menu.Root positioning={{ placement: 'bottom-start', strategy: 'fixed' }}>
                          <Menu.Trigger asChild>
                            <Button size="xs" variant="ghost" colorScheme="blue">
                              {section.matchType === 'all' ? 'all the rules below match' : 'any of the rules below match'}
                              <ExpandMoreIcon fontSize="small" style={{ marginLeft: '4px' }} />
                            </Button>
                          </Menu.Trigger>
                          <Menu.Positioner>
                            <Menu.Content>
                              <Menu.Item value="all" onClick={() => onSectionMatchTypeChange(section.id, 'all')}>
                                all the rules below match
                              </Menu.Item>
                              <Menu.Item value="any" onClick={() => onSectionMatchTypeChange(section.id, 'any')}>
                                any of the rules below match
                              </Menu.Item>
                            </Menu.Content>
                          </Menu.Positioner>
                        </Menu.Root>
                      )}
                      {entryEngagements.length > 0 && (
                        <Menu.Root positioning={{ placement: 'bottom-start', strategy: 'fixed' }}>
                          <Menu.Trigger asChild>
                            <Button size="xs" variant="ghost" colorScheme="blue">
                              {TIME_PERIOD_LABELS[section.timePeriod]}
                              <ExpandMoreIcon fontSize="small" style={{ marginLeft: '4px' }} />
                            </Button>
                          </Menu.Trigger>
                          <Menu.Positioner>
                            <Menu.Content>
                              <Menu.Item value="last7days" onClick={() => onSectionTimePeriodChange(section.id, 'last7days')}>
                                in the last 7 days
                              </Menu.Item>
                              <Menu.Item value="last30days" onClick={() => onSectionTimePeriodChange(section.id, 'last30days')}>
                                in the last 30 days
                              </Menu.Item>
                              <Menu.Item value="last90days" onClick={() => onSectionTimePeriodChange(section.id, 'last90days')}>
                                in the last 90 days
                              </Menu.Item>
                              <Menu.Item value="lastYear" onClick={() => onSectionTimePeriodChange(section.id, 'lastYear')}>
                                in the last year
                              </Menu.Item>
                              <Menu.Item value="allTime" onClick={() => onSectionTimePeriodChange(section.id, 'allTime')}>
                                all time
                              </Menu.Item>
                            </Menu.Content>
                          </Menu.Positioner>
                        </Menu.Root>
                      )}
                    </Flex>
                  </Flex>
                  {entryEngagements.map((rule) => (
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
                      sectionId="entry"
                      isInSelectionMode={false}
                      isSelected={false}
                      onDelete={() => onRuleDelete('entry', rule.id)}
                      onChange={(data) => onRuleChange('entry', rule.id, data)}
                      onToggleExcluded={() => onRuleToggleExcluded('entry', rule.id)}
                      onToggleDisabled={() => onRuleToggleDisabled('entry', rule.id)}
                      onCommentChange={(comment) => onRuleCommentChange('entry', rule.id, comment)}
                      onTrackVariableChange={(variable) => onRuleTrackVariableChange('entry', rule.id, variable)}
                      onToggleSelection={() => {}}
                    />
                  ))}
                </Box>

                {/* Add criteria input - shared for both Facts and Engagements */}
                <CriteriaSearchInput
                  sectionTitle="Enter audience if"
                  sectionId="entry"
                  facts={facts}
                  engagements={engagements}
                  isEngagementsOnly={false}
                  shouldFocus={focusSectionId === 'entry'}
                  hasAnyRules={entryFacts.length > 0 || entryEngagements.length > 0}
                  onAddProperty={(match) => onAddProperty('entry', match)}
                  onAddAISuggestions={(suggestions) => onAddAISuggestions('entry', suggestions)}
                />
              </Box>
            );
          }

          // Special handling for sync section
          if (section.id === 'sync') {
            // Show sync section if it has destinations OR has been activated
            if (syncDestinations.length > 0 || activatedSections.has('sync')) {
              return (
                <SyncSection
                  key={section.id}
                  destinations={syncDestinations}
                  experimentMode={experimentMode}
                  isModalOpen={isDestinationModalOpen}
                  isActive={activeSectionId === section.id}
                  onSetActive={() => onSetActiveSection(section.id)}
                  onOpenModal={onOpenDestinationModal}
                  onCloseModal={onCloseDestinationModal}
                  onSelectDestination={onSelectDestination}
                  onDestinationDelete={onDestinationDelete}
                  onDestinationTogglePaused={onDestinationTogglePaused}
                  onDestinationCommentChange={onDestinationCommentChange}
                  onDestinationPercentageChange={onDestinationPercentageChange}
                  onDestinationTargetAudienceChange={onDestinationTargetAudienceChange}
                  onExperimentToggle={onExperimentToggle}
                  onSplitEqually={onSplitEqually}
                />
              );
            }

            // On Sync tab: show ghost section immediately when empty
            if (activeTab === 'sync') {
              return (
                <>
                  <GhostSection
                    key={section.id}
                    sectionId={section.id}
                    title="Add destination"
                    description="Connect to destinations and activation platforms"
                    onAddSection={onOpenDestinationModal}
                  />
                  {/* Destination Picker Modal - must be rendered even with ghost section */}
                  <DestinationPickerModal
                    isOpen={isDestinationModalOpen}
                    onClose={onCloseDestinationModal}
                    onSelect={onSelectDestination}
                    excludeIds={syncDestinations.map(d => d.id)}
                  />
                </>
              );
            }

            // On Define tab: show ghost state after first rule is added
            if (hasAnyRules) {
              return (
                <GhostSection
                  key={section.id}
                  sectionId={section.id}
                  title={section.title}
                  description={sectionDescriptions[section.id]}
                  onAddSection={onAddSection}
                />
              );
            }

            return null;
          }

          // If section has no items and hasn't been activated, show ghost state
          // But only show ghost sections after first item is added anywhere
          if (section.items.length === 0 && !activatedSections.has(section.id)) {
            // Don't show ghost sections until there's at least one item
            if (!hasAnyRules) {
              return null;
            }
            return (
              <GhostSection
                key={section.id}
                sectionId={section.id}
                title={section.title}
                description={sectionDescriptions[section.id]}
                onAddSection={onAddSection}
              />
            );
          }

          return (
            <CriteriaSection
              key={section.id}
              sectionId={section.id}
              title={section.title}
              items={section.items}
              matchType={section.matchType}
              timePeriod={section.timePeriod}
              isCollapsed={section.isCollapsed}
              shouldFocusInput={focusSectionId === section.id}
              isActive={activeSectionId === section.id}
              isInSelectionMode={sectionSelectionMode[section.id] || false}
              selectedRuleIds={sectionSelectedRules[section.id] || new Set()}
              isEngagementsOnly={section.id === 'exit' || section.id === 'goals'}
              facts={facts}
              engagements={engagements}
              onMatchTypeChange={(matchType) => onSectionMatchTypeChange(section.id, matchType)}
              onTimePeriodChange={(timePeriod) => onSectionTimePeriodChange(section.id, timePeriod)}
              onToggleCollapse={() => onSectionToggleCollapse(section.id)}
              onSetActive={() => onSetActiveSection(section.id)}
              onRuleDelete={(ruleId) => onRuleDelete(section.id, ruleId)}
              onRuleAdd={(propertyId) => onRuleAdd(section.id, propertyId)}
              onRuleChange={(ruleId, data) => onRuleChange(section.id, ruleId, data)}
              onRuleToggleExcluded={(ruleId) => onRuleToggleExcluded(section.id, ruleId)}
              onRuleToggleDisabled={(ruleId) => onRuleToggleDisabled(section.id, ruleId)}
              onRuleCommentChange={(ruleId, comment) => onRuleCommentChange(section.id, ruleId, comment)}
              onRuleTrackVariableChange={(ruleId, variable) => onRuleTrackVariableChange(section.id, ruleId, variable)}
              onAddProperty={(match) => onAddProperty(section.id, match)}
              onAddAISuggestions={(suggestions) => onAddAISuggestions(section.id, suggestions)}
              onEnterSelectionMode={() => onEnterSelectionMode(section.id)}
              onExitSelectionMode={() => onExitSelectionMode(section.id)}
              onToggleRuleSelection={(ruleId) => onToggleRuleSelection(section.id, ruleId)}
              onGroupSelected={() => onGroupSelected(section.id)}
              onUngroupGroup={(groupId) => onUngroupGroup(section.id, groupId)}
              onGroupMatchTypeChange={(groupId, matchType) => onGroupMatchTypeChange(section.id, groupId, matchType)}
              onRenameGroup={(groupId, name) => onRenameGroup(section.id, groupId, name)}
            />
          );
        })}
      </VStack>
    </Box>
  );
};
