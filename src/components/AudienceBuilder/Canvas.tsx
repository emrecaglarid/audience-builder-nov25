import { Box, Text, VStack, Flex } from '@chakra-ui/react';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { CriteriaSection, MatchType, TimePeriod, type AddedRule, type RuleGroup } from './CriteriaSection';
import { SyncSection } from './SyncSection';
import { DestinationPickerModal } from './DestinationPickerModal';
import type { FactDefinition, EngagementDefinition } from '../../types/schema';
import type { AddedDestination, Destination } from '../../types/destination';

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
  activatedSections: Set<string>;
  activeSectionId: string;
  activeTab: 'audience' | 'goals' | 'sync' | 'analyze';
  syncDestinations: AddedDestination[];
  experimentMode: boolean;
  isDestinationModalOpen: boolean;
  sectionSelectionMode: Record<string, boolean>;
  sectionSelectedRules: Record<string, Set<string>>;
  showRuleCounts?: boolean;
  ruleCounts?: Record<string, number>;
  isReadOnly?: boolean;
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
  onRuleTimePeriodChange: (sectionId: string, ruleId: string, timePeriod: TimePeriod) => void;
  onAddSection: (sectionId: string) => void;
  onSetActiveSection: (sectionId: string) => void;
  onEnterSelectionMode: (sectionId: string) => void;
  onExitSelectionMode: (sectionId: string) => void;
  onToggleRuleSelection: (sectionId: string, ruleId: string) => void;
  onGroupSelected: (sectionId: string) => void;
  onUngroupGroup: (sectionId: string, groupId: string) => void;
  onDeleteGroup: (sectionId: string, groupId: string) => void;
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
  activatedSections,
  activeSectionId,
  activeTab,
  syncDestinations,
  experimentMode,
  isDestinationModalOpen,
  sectionSelectionMode,
  sectionSelectedRules,
  showRuleCounts = false,
  ruleCounts = {},
  isReadOnly = false,
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
  onRuleTimePeriodChange,
  onAddSection,
  onSetActiveSection,
  onEnterSelectionMode,
  onExitSelectionMode,
  onToggleRuleSelection,
  onGroupSelected,
  onUngroupGroup,
  onDeleteGroup,
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
    if (activeTab === 'audience') {
      // Audience tab: show entry + exit (who is in/out)
      return section.id === 'entry' || section.id === 'exit';
    } else if (activeTab === 'goals') {
      // Goals tab: show only goals
      return section.id === 'goals';
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
      maxWidth="1100px"
    >
      <VStack align="stretch" gap={4}>
        {visibleSections.map((section) => {
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
                  isReadOnly={isReadOnly}
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
              isActive={activeSectionId === section.id}
              isInSelectionMode={sectionSelectionMode[section.id] || false}
              selectedRuleIds={sectionSelectedRules[section.id] || new Set()}
              isEngagementsOnly={section.id === 'exit' || section.id === 'goals'}
              showRuleCounts={showRuleCounts}
              ruleCounts={ruleCounts}
              isReadOnly={isReadOnly}
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
              onRuleTimePeriodChange={(ruleId, timePeriod) => onRuleTimePeriodChange(section.id, ruleId, timePeriod)}
              onEnterSelectionMode={() => onEnterSelectionMode(section.id)}
              onExitSelectionMode={() => onExitSelectionMode(section.id)}
              onToggleRuleSelection={(ruleId) => onToggleRuleSelection(section.id, ruleId)}
              onGroupSelected={() => onGroupSelected(section.id)}
              onUngroupGroup={(groupId) => onUngroupGroup(section.id, groupId)}
              onDeleteGroup={(groupId) => onDeleteGroup(section.id, groupId)}
              onGroupMatchTypeChange={(groupId, matchType) => onGroupMatchTypeChange(section.id, groupId, matchType)}
              onRenameGroup={(groupId, name) => onRenameGroup(section.id, groupId, name)}
            />
          );
        })}
      </VStack>
    </Box>
  );
};
