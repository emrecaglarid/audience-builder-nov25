import { Box, Text, Flex } from '@chakra-ui/react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { FactDefinition, EngagementDefinition, PropertyDefinition } from '@/types';

type BrowseLevel = 'categories' | 'properties';

interface HierarchicalBrowseProps {
  facts: FactDefinition[];
  engagements: EngagementDefinition[];
  isEngagementsOnly?: boolean;
  browseLevel: BrowseLevel;
  selectedCategory: FactDefinition | EngagementDefinition | null;
  selectedIndex: number;
  inputRef: React.RefObject<HTMLInputElement>;
  onNavigate: (level: BrowseLevel, category?: FactDefinition | EngagementDefinition) => void;
  onAddProperty: (type: 'fact' | 'engagement', parentId: string, parentName: string, property: PropertyDefinition) => void;
  onBack: () => void;
}

export function HierarchicalBrowse({
  facts,
  engagements,
  isEngagementsOnly = false,
  browseLevel,
  selectedCategory,
  selectedIndex,
  onNavigate,
  onAddProperty,
}: HierarchicalBrowseProps) {

  // Render category list (all facts and engagements merged)
  if (browseLevel === 'categories' && !selectedCategory) {
    const allCategories = isEngagementsOnly
      ? engagements
      : [...facts, ...engagements];

    return (
      <Box
        position="absolute"
        top="100%"
        left={0}
        right={0}
        mt={1}
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        boxShadow="lg"
        zIndex={9999}
        maxH="300px"
        overflowY="auto"
        onMouseDown={(e) => e.preventDefault()}
      >
        {allCategories.map((category, index) => {
          const isFact = facts.find(f => f.id === category.id);
          const categoryType = isFact ? 'Fact' : 'Engagement';

          return (
            <Flex
              key={category.id}
              align="center"
              justify="space-between"
              px={3}
              py={2}
              cursor="pointer"
              bg={selectedIndex === index ? 'blue.50' : 'white'}
              _hover={{ bg: 'blue.50' }}
              onClick={() => onNavigate('properties', category)}
              borderBottom={index < allCategories.length - 1 ? '1px solid' : 'none'}
              borderColor="gray.100"
            >
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                  {category.name}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {categoryType}
                </Text>
              </Box>
              <ChevronRightIcon fontSize="small" style={{ color: '#718096' }} />
            </Flex>
          );
        })}
      </Box>
    );
  }

  // Render property list (when selectedCategory is set)
  if (selectedCategory) {
    const categoryType = facts.find(f => f.id === selectedCategory.id) ? 'fact' : 'engagement';

    return (
      <Box
        position="absolute"
        top="100%"
        left={0}
        right={0}
        mt={1}
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        boxShadow="lg"
        zIndex={9999}
        maxH="300px"
        overflowY="auto"
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Properties list */}
        {selectedCategory.properties.map((property, index) => (
          <Box
            key={property.id}
            px={3}
            py={2}
            cursor="pointer"
            bg={selectedIndex === index ? 'blue.50' : 'white'}
            _hover={{ bg: 'blue.50' }}
            onClick={() => onAddProperty(categoryType, selectedCategory.id, selectedCategory.name, property)}
            borderBottom={index < selectedCategory.properties.length - 1 ? '1px solid' : 'none'}
            borderColor="gray.100"
          >
            <Text fontSize="sm" fontWeight="medium" color="gray.800">
              {property.name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {selectedCategory.name}
            </Text>
          </Box>
        ))}
      </Box>
    );
  }

  return null;
}
