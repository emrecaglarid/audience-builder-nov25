import { Box, Text, VStack, Flex } from '@chakra-ui/react';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { CriteriaSection, MatchType, TimePeriod } from './CriteriaSection';
import { SyncSection } from './SyncSection';
import type { PropertyDefinition, FactDefinition, EngagementDefinition } from '../../types/schema';
import type { PropertyMatch } from './PropertyDropdown';
import type { AISuggestion } from './aiSuggestions';
import type { AddedDestination, Destination } from '../../types/destination';

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
  syncDestinations: AddedDestination[];
  experimentMode: boolean;
  isDestinationModalOpen: boolean;
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

  const { setNodeRef, isOver } = useDroppable({
    id: sectionId,
    data: {
      type: 'ghost-section',
      sectionId,
    },
  });

  return (
    <Box
      ref={setNodeRef}
      borderRadius="lg"
      border="1px solid"
      borderColor={isOver ? 'blue.400' : 'gray.100'}
      px={4}
      py={3}
      cursor="pointer"
      onClick={() => onAddSection(sectionId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      _hover={{ bg: 'gray.50' }}
      boxShadow={isOver ? 'lg' : 'none'}
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
  syncDestinations,
  experimentMode,
  isDestinationModalOpen,
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
  // Check if any section has rules (used to show/hide ghost sections)
  const hasAnyRules = sections.some(section => section.rules.length > 0);

  return (
    <Box
      width="100%"
      maxWidth="900px"
    >
      <VStack align="stretch" gap={4}>
        {sections.map((section) => {
          // Special handling for sync section
          if (section.id === 'sync') {
            // Show sync section if it has destinations OR has been activated
            if (syncDestinations.length > 0 || activatedSections.has('sync')) {
              return (
                <SyncSection
                  key={section.id}
                  destinations={syncDestinations}
                  experimentMode={experimentMode}
                  isCollapsed={section.isCollapsed}
                  isModalOpen={isDestinationModalOpen}
                  isActive={activeSectionId === section.id}
                  onToggleCollapse={() => onSectionToggleCollapse(section.id)}
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

            // Show ghost state after first rule is added
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

          // If section has no rules and hasn't been activated, show ghost state
          // But only show ghost sections after first rule is added anywhere
          if (section.rules.length === 0 && !activatedSections.has(section.id)) {
            // Don't show ghost sections until there's at least one rule
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
              rules={section.rules}
              matchType={section.matchType}
              timePeriod={section.timePeriod}
              isCollapsed={section.isCollapsed}
              shouldFocusInput={focusSectionId === section.id}
              isActive={activeSectionId === section.id}
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
            />
          );
        })}
      </VStack>
    </Box>
  );
};
