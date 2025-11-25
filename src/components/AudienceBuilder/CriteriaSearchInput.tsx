import { Box, Input, Flex } from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { FactDefinition, EngagementDefinition } from '@/types';
import { PropertyDropdown, type PropertyMatch } from './PropertyDropdown';
import { AISuggestionCards } from './AISuggestionCards';
import { detectInputMode, getAISuggestions, type AISuggestion } from './aiSuggestions';

interface CriteriaSearchInputProps {
  sectionTitle: string;
  sectionId?: string;
  facts: FactDefinition[];
  engagements: EngagementDefinition[];
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
  shouldFocus = false,
  hasAnyRules = false,
  onAddProperty,
  onAddAISuggestions,
}: CriteriaSearchInputProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'search' | 'ai' | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{
    suggestions: AISuggestion[];
    explanation: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Detect mode and get AI suggestions when input changes
  useEffect(() => {
    if (!searchValue.trim()) {
      setMode(null);
      setAiSuggestions(null);
      setSelectedIndex(0);
      return;
    }

    const detectedMode = detectInputMode(searchValue);
    setMode(detectedMode);

    if (detectedMode === 'ai') {
      const result = getAISuggestions(searchValue, facts, engagements);
      setAiSuggestions(result);
    } else {
      setAiSuggestions(null);
    }

    setSelectedIndex(0);
  }, [searchValue, facts, engagements]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // AI mode - no keyboard navigation, just Enter to add all
    if (mode === 'ai' && aiSuggestions) {
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
    if (mode === 'search') {
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
    setSearchValue('');
    setAiSuggestions(null);
  };

  const handleAskAI = () => {
    // Force AI mode and generate suggestions
    setMode('ai');
    const result = getAISuggestions(searchValue, facts, engagements);
    setAiSuggestions(result);
  };

  const handlePillClick = (pillLabel: string) => {
    setSearchValue(pillLabel);
    inputRef.current?.focus();
  };

  return (
    <Box position="relative" px={3} py={3}>
      <Input
        ref={inputRef}
        placeholder="Search properties or describe profiles"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleKeyDown}
        size="sm"
        variant="subtle"
        bg="gray.50"
        border="none"
        _focus={{ bg: 'white', border: '1px solid', borderColor: 'blue.500' }}
      />

      {/* Suggestion pills - only show when no rules exist */}
      {!hasAnyRules && !searchValue && (
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
              onClick={() => handlePillClick(pill.label)}
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
      {mode === 'search' && !aiSuggestions && (
        <PropertyDropdown
          searchQuery={searchValue}
          facts={facts}
          engagements={engagements}
          selectedIndex={selectedIndex}
          onSelect={handlePropertySelect}
          onMouseEnter={setSelectedIndex}
          onAskAI={handleAskAI}
          inputRef={inputRef}
        />
      )}

      {/* AI suggestion cards */}
      {mode === 'ai' && aiSuggestions && (
        <AISuggestionCards
          suggestions={aiSuggestions.suggestions}
          explanation={aiSuggestions.explanation}
          onAddAll={handleAddAllSuggestions}
          onAddSingle={handleAddSingleSuggestion}
          inputRef={inputRef}
        />
      )}
    </Box>
  );
}
