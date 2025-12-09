import { Box, Input, Flex } from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { FactDefinition, EngagementDefinition, PropertyDefinition } from '@/types';
import { PropertyDropdown, type PropertyMatch } from './PropertyDropdown';
import { AISuggestionCards } from './AISuggestionCards';
import { detectInputMode, getAISuggestions, type AISuggestion } from './aiSuggestions';
import { HierarchicalBrowse } from './HierarchicalBrowse';

type BrowseLevel = 'categories' | 'properties';

interface CriteriaSearchInputProps {
  sectionTitle: string;
  sectionId?: string;
  facts: FactDefinition[];
  engagements: EngagementDefinition[];
  isEngagementsOnly?: boolean;
  shouldFocus?: boolean;
  hasAnyRules?: boolean;
  onAddProperty: (match: PropertyMatch) => void;
  onAddAISuggestions: (suggestions: AISuggestion[]) => void;
}

interface SuggestionPill {
  label: string;
  isAI: boolean;
}

export function CriteriaSearchInput({
  sectionId,
  facts,
  engagements,
  isEngagementsOnly = false,
  shouldFocus = false,
  hasAnyRules = false,
  onAddProperty,
  onAddAISuggestions,
}: CriteriaSearchInputProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [searchMode, setSearchMode] = useState<'search' | 'ai' | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{
    suggestions: AISuggestion[];
    explanation: string;
  } | null>(null);
  const [browseLevel, setBrowseLevel] = useState<BrowseLevel>('categories');
  const [selectedCategory, setSelectedCategory] = useState<FactDefinition | EngagementDefinition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suggestion pills data - section-specific, properties first, then AI prompts
  const getSuggestionPills = (sectionId?: string): SuggestionPill[] => {
    switch (sectionId) {
      case 'entry':
        return [
          // Properties first
          { label: 'Age', isAI: false },
          { label: 'Country', isAI: false },
          { label: 'Gender', isAI: false },
          // AI prompts second
          { label: 'High-value customers', isAI: true },
          { label: 'New visitors', isAI: true },
        ];
      case 'goals':
        return [
          // Properties first
          { label: 'Page visit', isAI: false },
          { label: 'Order', isAI: false },
          { label: 'Email open', isAI: false },
          // AI prompts second
          { label: 'Made a purchase', isAI: true },
          { label: 'Engaged with content', isAI: true },
        ];
      case 'exit':
        return [
          // Properties first
          { label: 'Days since last visit', isAI: false },
          { label: 'Order count', isAI: false },
          { label: 'Email subscribed', isAI: false },
          // AI prompts second
          { label: 'Inactive for 30+ days', isAI: true },
          { label: 'Unsubscribed from emails', isAI: true },
        ];
      default:
        // Fallback for other sections (sync, etc.)
        return [
          { label: 'Age', isAI: false },
          { label: 'Country', isAI: false },
          { label: 'Page visit', isAI: false },
        ];
    }
  };

  const suggestionPills = getSuggestionPills(sectionId);

  // Auto-focus input when section becomes active
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [shouldFocus]);

  // Detect search/AI mode based on input value
  useEffect(() => {
    console.log('[useEffect searchValue] Triggered. searchValue:', searchValue, 'isBrowsing:', isBrowsing);

    // Empty input → clear search mode (browse will be shown if focused)
    if (!searchValue.trim()) {
      console.log('[useEffect searchValue] Empty search, clearing searchMode only');
      setSearchMode(null);
      setAiSuggestions(null);
      setSelectedIndex(0);
      return;
    }

    // Has text → exit browse mode, detect search/AI
    console.log('[useEffect searchValue] Has text, exiting browse mode');
    setIsBrowsing(false);

    const detectedMode = detectInputMode(searchValue);
    setSearchMode(detectedMode);

    if (detectedMode === 'ai') {
      const result = getAISuggestions(searchValue, facts, engagements);
      setAiSuggestions(result);
    } else {
      setAiSuggestions(null);
    }

    setSelectedIndex(0);
  }, [searchValue, facts, engagements, isBrowsing]);

  // Click outside detection for browse mode and AI mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isBrowsing) {
          setIsBrowsing(false);
          setBrowseLevel('categories');
          setSelectedCategory(null);
        }
        // Also handle AI mode
        if (searchMode === 'ai' && aiSuggestions) {
          setSearchValue('');
          setAiSuggestions(null);
          setSearchMode(null);
        }
      }
    };

    if (isBrowsing || (searchMode === 'ai' && aiSuggestions)) {
      document.addEventListener('mouseup', handleClickOutside);
      return () => {
        document.removeEventListener('mouseup', handleClickOutside);
      };
    }
  }, [isBrowsing, searchMode, aiSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Browse mode - hierarchical navigation
    if (isBrowsing) {
      // Get current items based on browse level
      let itemCount = 0;
      if (browseLevel === 'categories' && !selectedCategory) {
        // All categories merged (facts + engagements)
        const allCategories = isEngagementsOnly
          ? engagements
          : [...facts, ...engagements];
        itemCount = allCategories.length;
      } else if (selectedCategory) {
        // Properties of selected category
        itemCount = selectedCategory.properties.length;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % itemCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleBrowseEnter();
      } else if (e.key === 'Backspace' && !searchValue) {
        e.preventDefault();
        handleBrowseBack();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsBrowsing(false);
        setBrowseLevel('categories');
        setSelectedCategory(null);
        inputRef.current?.blur();
      }
      return;
    }

    // AI mode - no keyboard navigation, just Enter to add all
    if (searchMode === 'ai' && aiSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onAddAISuggestions(aiSuggestions.suggestions);
        setSearchValue('');
        setAiSuggestions(null);
      } else if (e.key === 'Escape') {
        setSearchValue('');
        setAiSuggestions(null);
      }
      return;
    }

    // Search mode - keyboard navigation
    if (searchMode === 'search') {
      // Get current matches count from PropertyDropdown logic
      const query = searchValue.toLowerCase();
      let matchCount = 0;

      [...facts, ...engagements].forEach((item) => {
        item.properties.forEach((property) => {
          const nameMatch = property.name.toLowerCase().includes(query);
          const descMatch = property.description.toLowerCase().includes(query);
          const parentMatch = item.name.toLowerCase().includes(query);
          if (nameMatch || descMatch || parentMatch) {
            matchCount++;
          }
        });
      });

      matchCount = Math.min(matchCount, 8); // Limit to 8

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % matchCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + matchCount) % matchCount);
      } else if (e.key === 'Enter' && matchCount === 0) {
        // No property matches - trigger AI mode
        e.preventDefault();
        handleAskAI();
      } else if (e.key === 'Enter' && matchCount > 0) {
        e.preventDefault();
        // Find the selected match and add it
        const matches: PropertyMatch[] = [];

        facts.forEach((fact) => {
          fact.properties.forEach((property) => {
            const nameMatch = property.name.toLowerCase().includes(query);
            const descMatch = property.description.toLowerCase().includes(query);
            const parentMatch = fact.name.toLowerCase().includes(query);

            if (nameMatch || descMatch || parentMatch) {
              let score = 0;
              if (property.name.toLowerCase().startsWith(query)) score += 10;
              if (property.name.toLowerCase() === query) score += 20;
              if (nameMatch) score += 5;
              if (parentMatch) score += 2;
              if (descMatch) score += 1;

              matches.push({
                type: 'fact',
                parentId: fact.id,
                parentName: fact.name,
                property,
                score,
              });
            }
          });
        });

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

              matches.push({
                type: 'engagement',
                parentId: engagement.id,
                parentName: engagement.name,
                property,
                score,
              });
            }
          });
        });

        const sortedMatches = matches
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.property.name.localeCompare(b.property.name);
          })
          .slice(0, 8);

        if (sortedMatches[selectedIndex]) {
          onAddProperty(sortedMatches[selectedIndex]);
          setSearchValue('');
        }
      } else if (e.key === 'Escape') {
        setSearchValue('');
      }
    }
  };

  const handlePropertySelect = (match: PropertyMatch) => {
    onAddProperty(match);
    setSearchValue('');
  };

  const handleAddAllSuggestions = () => {
    if (aiSuggestions && aiSuggestions.suggestions.length > 0) {
      onAddAISuggestions(aiSuggestions.suggestions);
      setSearchValue('');
      setAiSuggestions(null);
    }
  };

  const handleAddSingleSuggestion = (suggestion: AISuggestion) => {
    onAddAISuggestions([suggestion]);
    // DON'T clear searchValue or aiSuggestions - keep menu open
  };

  const handleAskAI = () => {
    // Force AI mode and generate suggestions
    setSearchMode('ai');
    setIsBrowsing(false);
    const result = getAISuggestions(searchValue, facts, engagements);
    setAiSuggestions(result);
  };

  const findPropertyByName = (name: string): PropertyMatch | null => {
    const query = name.toLowerCase();

    // Search facts
    for (const fact of facts) {
      const property = fact.properties.find(p =>
        p.name.toLowerCase() === query
      );
      if (property) {
        return {
          type: 'fact',
          parentId: fact.id,
          parentName: fact.name,
          property,
          score: 0,
        };
      }
    }

    // Search engagements (only if not engagements-only section)
    if (!isEngagementsOnly) {
      for (const engagement of engagements) {
        const property = engagement.properties.find(p =>
          p.name.toLowerCase() === query
        );
        if (property) {
          return {
            type: 'engagement',
            parentId: engagement.id,
            parentName: engagement.name,
            property,
            score: 0,
          };
        }
      }
    }

    return null;
  };

  const handlePillClick = (pillLabel: string, isAI: boolean) => {
    if (isAI) {
      // AI pill: trigger AI mode with the label as prompt
      setSearchValue(pillLabel);
      setSearchMode('ai');
      setIsBrowsing(false);
      const result = getAISuggestions(pillLabel, facts, engagements);
      setAiSuggestions(result);
      inputRef.current?.focus();
    } else {
      // Property pill: find and add the property immediately
      const match = findPropertyByName(pillLabel);
      if (match) {
        onAddProperty(match);
      }
    }
  };

  const handleFocus = () => {
    // Enter browse mode when input is focused and empty
    if (!searchValue.trim()) {
      setIsBrowsing(true);
      setBrowseLevel('categories');
      setSelectedIndex(0);
    }
  };

  const handleBrowseNavigate = (level: BrowseLevel, category?: FactDefinition | EngagementDefinition) => {
    if (level === 'properties' && category) {
      // Navigate from categories to properties
      setSelectedCategory(category);
      setSelectedIndex(0);
    }
  };

  const handleBrowseBack = () => {
    if (selectedCategory) {
      // Go back from properties to categories
      setSelectedCategory(null);
      setSelectedIndex(0);
    }
  };

  const handleBrowseEnter = () => {
    // Navigate deeper or add property based on current level
    if (browseLevel === 'categories' && !selectedCategory) {
      // Navigate to specific category's properties
      const allCategories = isEngagementsOnly
        ? engagements
        : [...facts, ...engagements];
      const selectedCat = allCategories[selectedIndex];
      if (selectedCat) {
        handleBrowseNavigate('properties', selectedCat);
      }
    } else if (selectedCategory) {
      // Add the selected property
      const property = selectedCategory.properties[selectedIndex];
      if (property) {
        handleBrowseAddProperty(
          facts.find(f => f.id === selectedCategory.id) ? 'fact' : 'engagement',
          selectedCategory.id,
          selectedCategory.name,
          property
        );
      }
    }
  };

  const handleBrowseAddProperty = (
    type: 'fact' | 'engagement',
    parentId: string,
    parentName: string,
    property: PropertyDefinition
  ) => {
    const match: PropertyMatch = {
      type,
      parentId,
      parentName,
      property,
      score: 0,
    };
    onAddProperty(match);
    // DON'T clear searchValue or close browse mode
    // DON'T clear selectedCategory - keep user in same properties list
    // Just keep everything as-is so they can add more properties from same category
  };

  return (
    <Box ref={containerRef} position="relative" px={3} py={3} overflow="visible">
      <Input
        ref={inputRef}
        placeholder="Search properties or describe profiles"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        size="sm"
        variant="subtle"
        bg="gray.50"
        border="none"
        _focus={{ bg: 'white', border: '1px solid', borderColor: 'blue.500' }}
      />

      {/* Suggestion pills - only show when no rules exist */}
      {!hasAnyRules && !searchValue && !isBrowsing && !searchMode && (
        <Flex gap={2} mt={2} flexWrap="wrap">
          {suggestionPills.map((pill, index) => (
            <Box
              key={index}
              as="button"
              px={3}
              py={1.5}
              bg="gray.100"
              color="gray.700"
              borderRadius="md"
              fontSize="sm"
              cursor="pointer"
              onClick={() => handlePillClick(pill.label, pill.isAI)}
              _hover={{ bg: 'gray.200' }}
              transition="background 0.2s"
              display="flex"
              alignItems="center"
              gap={1}
            >
              {pill.isAI && (
                <AutoAwesomeIcon
                  fontSize="inherit"
                  style={{ fontSize: '14px' }}
                />
              )}
              {pill.label}
            </Box>
          ))}
        </Flex>
      )}

      {/* Property search dropdown */}
      {searchMode === 'search' && !aiSuggestions && (
        <PropertyDropdown
          searchQuery={searchValue}
          facts={facts}
          engagements={engagements}
          isEngagementsOnly={isEngagementsOnly}
          selectedIndex={selectedIndex}
          onSelect={handlePropertySelect}
          onMouseEnter={setSelectedIndex}
          onAskAI={handleAskAI}
          inputRef={inputRef}
        />
      )}

      {/* AI suggestion cards */}
      {searchMode === 'ai' && aiSuggestions && (
        <AISuggestionCards
          suggestions={aiSuggestions.suggestions}
          explanation={aiSuggestions.explanation}
          onAddAll={handleAddAllSuggestions}
          onAddSingle={handleAddSingleSuggestion}
          inputRef={inputRef}
        />
      )}

      {/* Hierarchical browse dropdown */}
      {isBrowsing && (
        <HierarchicalBrowse
          facts={facts}
          engagements={engagements}
          isEngagementsOnly={isEngagementsOnly}
          browseLevel={browseLevel}
          selectedCategory={selectedCategory}
          selectedIndex={selectedIndex}
          inputRef={inputRef}
          onNavigate={handleBrowseNavigate}
          onAddProperty={handleBrowseAddProperty}
          onBack={handleBrowseBack}
        />
      )}
    </Box>
  );
}
