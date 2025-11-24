import { Box, Text, VStack, Portal, Flex } from '@chakra-ui/react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useMemo } from 'react';
import type { FactDefinition, EngagementDefinition, PropertyDefinition } from '@/types';

interface PropertyMatch {
  type: 'fact' | 'engagement';
  parentId: string;
  parentName: string;
  property: PropertyDefinition;
  score: number; // For ranking results
}

interface PropertyDropdownProps {
  searchQuery: string;
  facts: FactDefinition[];
  engagements: EngagementDefinition[];
  selectedIndex: number;
  onSelect: (match: PropertyMatch) => void;
  onMouseEnter: (index: number) => void;
  onAskAI: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function PropertyDropdown({
  searchQuery,
  facts,
  engagements,
  selectedIndex,
  onSelect,
  onMouseEnter,
  onAskAI,
  inputRef,
}: PropertyDropdownProps) {
  // Search and rank properties
  const matches = useMemo(() => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();
    const results: PropertyMatch[] = [];

    // Search facts
    facts.forEach((fact) => {
      fact.properties.forEach((property) => {
        const nameMatch = property.name.toLowerCase().includes(query);
        const descMatch = property.description.toLowerCase().includes(query);
        const parentMatch = fact.name.toLowerCase().includes(query);

        if (nameMatch || descMatch || parentMatch) {
          // Calculate score for ranking
          let score = 0;
          if (property.name.toLowerCase().startsWith(query)) score += 10;
          if (property.name.toLowerCase() === query) score += 20;
          if (nameMatch) score += 5;
          if (parentMatch) score += 2;
          if (descMatch) score += 1;

          results.push({
            type: 'fact',
            parentId: fact.id,
            parentName: fact.name,
            property,
            score,
          });
        }
      });
    });

    // Search engagements
    engagements.forEach((engagement) => {
      engagement.properties.forEach((property) => {
        const nameMatch = property.name.toLowerCase().includes(query);
        const descMatch = property.description.toLowerCase().includes(query);
        const parentMatch = engagement.name.toLowerCase().includes(query);

        if (nameMatch || descMatch || parentMatch) {
          let score = 0;
          if (property.name.toLowerCase().startsWith(query)) score += 10;
          if (property.name.toLowerCase() === query) score += 20;
          if (nameMatch) score += 5;
          if (parentMatch) score += 2;
          if (descMatch) score += 1;

          results.push({
            type: 'engagement',
            parentId: engagement.id,
            parentName: engagement.name,
            property,
            score,
          });
        }
      });
    });

    // Sort by score, then alphabetically
    return results
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.property.name.localeCompare(b.property.name);
      })
      .slice(0, 8); // Limit to top 8 results
  }, [searchQuery, facts, engagements]);

  // Show dropdown if there are matches OR if there's a search query (to show AI option)
  if (matches.length === 0 && !searchQuery) {
    return null;
  }

  // Get input position for positioning
  const inputRect = inputRef.current?.getBoundingClientRect();

  return (
    <Portal>
      <Box
        position="fixed"
        top={inputRect ? `${inputRect.bottom + 4}px` : 0}
        left={inputRect ? `${inputRect.left}px` : 0}
        width={inputRect ? `${inputRect.width}px` : 'auto'}
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        boxShadow="lg"
        zIndex={1500}
        maxHeight="300px"
        overflowY="auto"
      >
        <VStack align="stretch" gap={0}>
          {matches.map((match, index) => (
            <Box
              key={`${match.parentId}-${match.property.id}`}
              px={3}
              py={2}
              cursor="pointer"
              bg={selectedIndex === index ? 'blue.50' : 'white'}
              _hover={{ bg: 'blue.50' }}
              onClick={() => onSelect(match)}
              onMouseEnter={() => onMouseEnter(index)}
              borderBottom={index < matches.length - 1 ? '1px solid' : 'none'}
              borderColor="gray.100"
            >
              <Text fontSize="sm" fontWeight="medium" color="gray.800">
                {match.property.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {match.parentName}
                {match.property.description && ` • ${match.property.description}`}
              </Text>
            </Box>
          ))}

          {/* AI Agent Option - Always show when there's a search query */}
          {searchQuery && (
            <Box
              px={3}
              py={3}
              cursor="pointer"
              bg="blue.50"
              _hover={{ bg: 'blue.100' }}
              onClick={onAskAI}
              borderTop={matches.length > 0 ? '1px solid' : 'none'}
              borderColor="gray.200"
            >
              <Flex align="center" gap={2}>
                <AutoAwesomeIcon fontSize="small" style={{ color: '#3182CE', fontSize: '18px' }} />
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="blue.700">
                    Ask AI Agent
                  </Text>
                  <Text fontSize="xs" color="blue.600" mt={0.5}>
                    "{searchQuery}"
                  </Text>
                </Box>
              </Flex>
            </Box>
          )}
        </VStack>
      </Box>
    </Portal>
  );
}

export type { PropertyMatch };
