import { Box, VStack, Text, Separator, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ruleToSentence } from '@/utils/ruleSummarizer';
import type { PropertyDefinition } from '@/types';
import type { AddedDestination } from '@/types/destination';

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

interface RuleGroup {
  id: string;
  type: 'group';
  matchType: MatchType;
  rules: AddedRule[];
  collapsed?: boolean;
  name?: string;
  disabled?: boolean;
}

// Type guard to check if an item is a RuleGroup
function isRuleGroup(item: AddedRule | RuleGroup): item is RuleGroup {
  return 'type' in item && item.type === 'group';
}

type MatchType = 'all' | 'any';
type TimePeriod = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'allTime' | 'customRange';

interface SectionConfig {
  id: string;
  title: string;
  items: (AddedRule | RuleGroup)[];
  matchType: MatchType;
  timePeriod: TimePeriod;
  isCollapsed: boolean;
}

interface AudienceSummaryProps {
  sections: SectionConfig[];
  syncDestinations: AddedDestination[];
  experimentMode: boolean;
}

export const AudienceSummary = ({
  sections,
  syncDestinations,
  experimentMode,
}: AudienceSummaryProps) => {
  // Collapse state: start with all sections collapsed except 'entry'
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(['goals', 'exit', 'sync'])
  );

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Helper function to format individual destination lines
  const formatDestinationLine = (dest: AddedDestination): string => {
    const platformName = dest.platformType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    const audienceName = dest.targetAudienceName || 'audience';
    const base = `${platformName} (${dest.accountName}) as "${audienceName}"`;

    if (experimentMode && dest.trafficPercentage !== undefined) {
      return `${base} - ${dest.trafficPercentage}%`;
    }

    return base;
  };

  // Filter to only sections with items (excluding sync which is handled separately)
  const activeSections = sections.filter(s => s.id !== 'sync' && s.items.length > 0);

  const timePeriodLabels: Record<TimePeriod, string> = {
    last7days: 'in last 7 days',
    last30days: 'in last 30 days',
    last90days: 'in last 90 days',
    lastYear: 'in last year',
    allTime: 'all time',
    customRange: 'in custom range',
  };

  return (
    <Box width="320px" flexShrink={0}>
      <VStack align="stretch" gap={6}>
        {/* Entry/Goals/Exit sections */}
        {activeSections.map((section) => {
          const matchTypeLabel = section.matchType === 'all'
            ? 'if all of the following are true'
            : 'if any of the following are true';
          const timeLabel = timePeriodLabels[section.timePeriod];
          const isCollapsed = collapsedSections.has(section.id);

          return (
            <Box key={section.id}>
              {/* Collapsible Section Header */}
              <Flex
                align="center"
                gap={2}
                cursor="pointer"
                onClick={() => toggleSection(section.id)}
                _hover={{ bg: 'gray.50' }}
                borderRadius="md"
                px={2}
                py={1}
                ml={-2}
                mb={isCollapsed ? 0 : 1}
              >
                {isCollapsed ? (
                  <ChevronRightIcon fontSize="small" style={{ color: '#718096' }} />
                ) : (
                  <ExpandMoreIcon fontSize="small" style={{ color: '#718096' }} />
                )}
                <Text fontSize="md" fontWeight="medium" color="gray.800">
                  {section.title}
                </Text>
              </Flex>

              {/* Section content - only show when not collapsed */}
              {!isCollapsed && (
                <>
                  {/* Match type */}
                  <Text fontSize="xs" color="gray.500" mb={3}>
                    {matchTypeLabel}
                  </Text>

                  {/* Rules in bordered container */}
                  <Box
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    overflow="hidden"
                    mb={3}
                  >
                    <VStack align="stretch" gap={0}>
                      {section.items
                        .filter(item => !isRuleGroup(item))
                        .map((item, index, array) => {
                          if (isRuleGroup(item)) return null;
                          const rule = item as AddedRule;
                          return (
                            <Box key={rule.id}>
                              <Text
                                fontSize="sm"
                                color={rule.disabled ? 'gray.400' : 'gray.700'}
                                textDecoration={rule.disabled ? 'line-through' : 'none'}
                                py={2}
                                px={3}
                              >
                                {ruleToSentence(rule)}
                              </Text>
                              {index < array.length - 1 && (
                                <Separator />
                              )}
                            </Box>
                          );
                        })}
                    </VStack>
                  </Box>

                  {/* Time period - moved to bottom */}
                  <Text fontSize="xs" color="gray.500">
                    {timeLabel}
                  </Text>
                </>
              )}
            </Box>
          );
        })}

        {/* Sync and activation section */}
        {syncDestinations.length > 0 && (
          <Box>
            {/* Collapsible Section Header */}
            <Flex
              align="center"
              gap={2}
              cursor="pointer"
              onClick={() => toggleSection('sync')}
              _hover={{ bg: 'gray.50' }}
              borderRadius="md"
              px={2}
              py={1}
              ml={-2}
              mb={collapsedSections.has('sync') ? 0 : 3}
            >
              {collapsedSections.has('sync') ? (
                <ChevronRightIcon fontSize="small" style={{ color: '#718096' }} />
              ) : (
                <ExpandMoreIcon fontSize="small" style={{ color: '#718096' }} />
              )}
              <Text fontSize="md" fontWeight="medium" color="gray.800">
                Sync and activation
              </Text>
            </Flex>

            {/* Destination list - show as individual lines */}
            {!collapsedSections.has('sync') && (
              <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                overflow="hidden"
              >
                <VStack align="stretch" gap={0}>
                  {syncDestinations.map((dest, index, array) => (
                    <Box key={dest.id}>
                      <Text fontSize="sm" color="gray.700" py={2} px={3}>
                        {formatDestinationLine(dest)}
                      </Text>
                      {index < array.length - 1 && (
                        <Separator />
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
        )}

        {/* Empty state */}
        {activeSections.length === 0 && syncDestinations.length === 0 && (
          <Box py={8}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              No rules defined yet
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
