import { Box, VStack, Text, Flex, Badge } from '@chakra-ui/react';
import { useState } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ruleToSentence, destinationsToSentence } from '@/utils/ruleSummarizer';
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

type MatchType = 'all' | 'any';
type TimePeriod = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'allTime' | 'customRange';

interface SectionConfig {
  id: string;
  title: string;
  rules: AddedRule[];
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
  // Filter to only sections with rules (excluding sync which is handled separately)
  const activeSections = sections.filter(s => s.id !== 'sync' && s.rules.length > 0);

  // Collapsible state for each section
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <Box
      width="320px"
      height="fit-content"
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      flexShrink={0}
      display="flex"
      flexDirection="column"
    >
      {/* Content */}
      <Box p={4}>
        <VStack align="stretch" gap={6}>
          {/* Entry/Goals/Exit sections */}
          {activeSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const matchTypeLabel = section.matchType === 'all' ? 'all of' : 'any of';
            const timePeriodLabels: Record<TimePeriod, string> = {
              last7days: 'in the last 7 days',
              last30days: 'in the last 30 days',
              last90days: 'in the last 90 days',
              lastYear: 'in the last year',
              allTime: 'all time',
              customRange: 'in custom range',
            };
            const timeLabel = timePeriodLabels[section.timePeriod];

            return (
              <Box key={section.id}>
                {/* Combined header - clickable to expand/collapse */}
                <Flex
                  align="center"
                  gap={1}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  p={2}
                  borderRadius="md"
                  onClick={() => toggleSection(section.id)}
                  mb={isExpanded ? 2 : 0}
                >
                  {isExpanded ? (
                    <ExpandMoreIcon fontSize="small" style={{ color: '#718096' }} />
                  ) : (
                    <ChevronRightIcon fontSize="small" style={{ color: '#718096' }} />
                  )}
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" flex="1">
                    {section.title} {matchTypeLabel} the following {timeLabel}
                  </Text>
                  <Badge fontSize="xs" colorScheme="purple">
                    {section.rules.length}
                  </Badge>
                </Flex>

                {/* Rule sentences - only shown when expanded */}
                {isExpanded && (
                  <VStack align="stretch" gap={1} pl={6}>
                    {section.rules.map((rule) => (
                      <Flex key={rule.id} align="flex-start" gap={2}>
                        <Text fontSize="xs" color="gray.400" mt={0.5}>•</Text>
                        <Text
                          fontSize="sm"
                          color={rule.disabled ? 'gray.400' : 'gray.700'}
                          textDecoration={rule.disabled ? 'line-through' : 'none'}
                        >
                          {ruleToSentence(rule)}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </Box>
            );
          })}

          {/* Sync and activation section */}
          {syncDestinations.length > 0 && (
            <Box>
              {/* Combined header - clickable to expand/collapse */}
              <Flex
                align="center"
                gap={1}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                p={2}
                borderRadius="md"
                onClick={() => toggleSection('sync')}
                mb={expandedSections.has('sync') ? 2 : 0}
              >
                {expandedSections.has('sync') ? (
                  <ExpandMoreIcon fontSize="small" style={{ color: '#718096' }} />
                ) : (
                  <ChevronRightIcon fontSize="small" style={{ color: '#718096' }} />
                )}
                <Text fontSize="sm" fontWeight="medium" color="gray.700" flex="1">
                  Sync and activation
                </Text>
                <Badge fontSize="xs" colorScheme="purple">
                  {syncDestinations.length}
                </Badge>
              </Flex>

              {/* Destination summary - only shown when expanded */}
              {expandedSections.has('sync') && (
                <Box pl={6}>
                  <Text fontSize="sm" color="gray.700">
                    {destinationsToSentence(syncDestinations, experimentMode)}
                  </Text>
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
    </Box>
  );
};
