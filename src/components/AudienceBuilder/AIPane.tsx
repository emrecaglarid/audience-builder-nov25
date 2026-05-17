import { Box, Text, VStack, Flex, Input, IconButton, Badge, Button } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import SendIcon from '@mui/icons-material/Send';
import CheckIcon from '@mui/icons-material/Check';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { FactDefinition, EngagementDefinition } from '@/types';
import { getAISuggestions, type AISuggestion } from './aiSuggestions';

interface AIPaneProps {
  facts: FactDefinition[];
  engagements: EngagementDefinition[];
  activeSectionId: string;
  activeSectionName: string;
  initialQuery?: string;
  onAddSuggestions: (sectionId: string, suggestions: AISuggestion[]) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: AISuggestion[];
  followUps?: string[];
  timestamp: Date;
}

function formatOperator(operator: string): string {
  const labels: Record<string, string> = {
    equals: 'equals',
    notEquals: 'does not equal',
    greaterThan: '>',
    lessThan: '<',
    greaterThanOrEqual: '>=',
    lessThanOrEqual: '<=',
    between: 'between',
    contains: 'contains',
    startsWith: 'starts with',
    endsWith: 'ends with',
    isTrue: 'is true',
    isFalse: 'is false',
    before: 'before',
    after: 'after',
    last7days: 'in last 7 days',
    last30days: 'in last 30 days',
    last90days: 'in last 90 days',
    lastYear: 'in last year',
    allTime: 'all time',
  };
  return labels[operator] || operator;
}

function formatValue(value: string | number | boolean, operator: string): string {
  if (operator === 'isTrue' || operator === 'isFalse') return '';
  if (operator.startsWith('last') || operator === 'allTime') return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === '') return '';
  return String(value);
}

// Determine follow-up suggestions based on the scenario that was just added
function getFollowUps(explanation: string): string[] {
  const lower = explanation.toLowerCase();
  if (lower.includes('high-value') || lower.includes('vip') || lower.includes('loyal')) {
    return ['Narrow by recency', 'Add location filter', 'Filter by email engagement'];
  }
  if (lower.includes('lapsed') || lower.includes('win-back') || lower.includes('dormant')) {
    return ['Add spending history', 'Narrow by visit frequency', 'Add demographic filter'];
  }
  if (lower.includes('cart') || lower.includes('abandonment')) {
    return ['Add spending threshold', 'Narrow by visit frequency', 'Filter by email engagement'];
  }
  if (lower.includes('email') || lower.includes('subscriber')) {
    return ['Narrow by purchase history', 'Narrow by recency', 'Add demographic filter'];
  }
  if (lower.includes('recency') || lower.includes('recent')) {
    return ['Add spending history', 'Add location filter', 'Filter by email engagement'];
  }
  if (lower.includes('spending') || lower.includes('order value')) {
    return ['Narrow by recency', 'Add location filter', 'Add demographic filter'];
  }
  if (lower.includes('location')) {
    return ['Add spending history', 'Narrow by recency', 'Filter by email engagement'];
  }
  if (lower.includes('visit') || lower.includes('session')) {
    return ['Add spending threshold', 'Narrow by recency', 'Add demographic filter'];
  }
  if (lower.includes('purchase history') || lower.includes('purchase')) {
    return ['Add spending history', 'Narrow by recency', 'Add demographic filter'];
  }
  if (lower.includes('demographic') || lower.includes('age')) {
    return ['Add spending history', 'Add location filter', 'Narrow by recency'];
  }
  return ['Add spending threshold', 'Add location filter', 'Narrow by recency'];
}

function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes typingPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <Flex align="center" gap={1} py={1}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <Box
            key={i}
            w="7px"
            h="7px"
            borderRadius="full"
            bg="gray.400"
            style={{ animation: `typingPulse 1.1s ease-in-out ${delay}s infinite` }}
          />
        ))}
      </Flex>
    </>
  );
}

interface SuggestionCardProps {
  suggestion: AISuggestion;
  isAdded: boolean;
  onAdd: () => void;
}

function SuggestionCard({ suggestion, isAdded, onAdd }: SuggestionCardProps) {
  const operatorText = formatOperator(suggestion.operator);
  const valueText = formatValue(suggestion.value, suggestion.operator);

  return (
    <Box
      border="1px solid"
      borderColor={isAdded ? 'green.200' : 'gray.200'}
      borderRadius="md"
      px={3}
      py={2}
      bg={isAdded ? 'green.50' : 'white'}
      _hover={!isAdded ? { bg: 'gray.50', borderColor: 'gray.400' } : {}}
      cursor={isAdded ? 'default' : 'pointer'}
      onClick={() => !isAdded && onAdd()}
      transition="all 0.2s"
    >
      <Flex align="center" justify="space-between">
        <Flex align="center" gap={2} flex={1} flexWrap="wrap">
          <Text fontSize="xs" fontWeight="medium" color="gray.700">
            {suggestion.propertyName}
          </Text>
          <Text fontSize="xs" color="gray.500">{operatorText}</Text>
          {valueText && (
            <Text fontSize="xs" fontWeight="medium" color="blue.600">{valueText}</Text>
          )}
        </Flex>
        {isAdded ? (
          <Badge colorScheme="green" fontSize="xs">Added</Badge>
        ) : (
          <Flex align="center" gap={1} color="gray.700" fontSize="xs" fontWeight="medium">
            <CheckIcon style={{ fontSize: '14px' }} />
            Add
          </Flex>
        )}
      </Flex>
      <Text fontSize="xs" color="gray.400" mt={1}>{suggestion.parentName}</Text>
    </Box>
  );
}

export function AIPane({
  facts,
  engagements,
  activeSectionId,
  activeSectionName: _activeSectionName,
  initialQuery = '',
  onAddSuggestions,
}: AIPaneProps) {
  const welcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: "Hi! Describe the audience you want to build and I'll suggest criteria.",
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addedMessageIds, setAddedMessageIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialQuerySent = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-send the initial query that came from the library search
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !initialQuerySent.current) {
      initialQuerySent.current = true;
      handleSend(initialQuery);
    }
  }, []);

  const handleSend = async (query?: string) => {
    const messageText = (query || inputValue).trim();
    if (!messageText || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Thinking animation — longer for multi-condition prompts
    setIsTyping(true);
    const thinkingMs = messageText.split(' ').length > 4 ? 1800 + Math.random() * 800 : 1000 + Math.random() * 600;
    await new Promise(r => setTimeout(r, thinkingMs));

    const result = getAISuggestions(messageText, facts, engagements);
    const suggestions = result?.suggestions || [];
    const followUps = suggestions.length > 0 ? getFollowUps(result!.explanation) : [];

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: suggestions.length > 0
        ? `Here's a rule set for "${messageText}". Add the ones that fit, or add all at once.`
        : `I couldn't build rules for "${messageText}". Try describing your audience differently, like "high-value customers" or "lapsed buyers".`,
      suggestions,
      followUps,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddSuggestion = (suggestion: AISuggestion) => {
    onAddSuggestions(activeSectionId, [suggestion]);
    setAddedIds(prev => new Set([...prev, suggestion.id]));
  };

  const handleAddAll = (message: ChatMessage) => {
    if (!message.suggestions?.length) return;
    onAddSuggestions(activeSectionId, message.suggestions);
    setAddedMessageIds(prev => new Set([...prev, message.id]));
    setAddedIds(prev => {
      const next = new Set(prev);
      message.suggestions!.forEach(s => next.add(s.id));
      return next;
    });
  };

  const handleFollowUp = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <Box
      width="320px"
      height="100%"
      bg="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.200"
      display="flex"
      flexDirection="column"
      flexShrink={0}
    >
      {/* Header */}
      <Flex align="center" gap={2} px={4} py={3} borderBottom="1px solid" borderColor="gray.200">
        <AutoAwesomeIcon style={{ fontSize: '18px', color: '#6B46C1' }} />
        <Text fontWeight="semibold" fontSize="md">AI Assistant</Text>
      </Flex>

      {/* Messages */}
      <Box flex={1} overflowY="auto" px={4} py={3}>
        <VStack align="stretch" gap={3}>
          {messages.map((message) => (
            <Box key={message.id}>
              {message.role === 'user' ? (
                <Flex justify="flex-end">
                  <Box
                    maxW="85%"
                    bg="gray.800"
                    color="white"
                    px={3}
                    py={2}
                    borderRadius="lg"
                    borderBottomRightRadius="sm"
                  >
                    <Text fontSize="sm">{message.content}</Text>
                  </Box>
                </Flex>
              ) : (
                <Box maxW="100%">
                  <Box
                    bg="gray.100"
                    px={3}
                    py={2}
                    borderRadius="lg"
                    borderBottomLeftRadius="sm"
                    mb={message.suggestions?.length ? 2 : 0}
                  >
                    <Text fontSize="sm" color="gray.700">{message.content}</Text>
                  </Box>

                  {/* Suggestion cards */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <VStack align="stretch" gap={2} pl={2}>
                      {message.suggestions.map((suggestion) => (
                        <SuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          isAdded={addedIds.has(suggestion.id)}
                          onAdd={() => handleAddSuggestion(suggestion)}
                        />
                      ))}

                      {/* Add all / confirmation */}
                      {addedMessageIds.has(message.id) ? (
                        <>
                          <Flex align="center" gap={1} py={1} color="green.600" fontSize="sm" fontWeight="medium">
                            <CheckIcon style={{ fontSize: '16px' }} />
                            Added {message.suggestions.length} rules
                          </Flex>

                          {/* Follow-up paths */}
                          {message.followUps && message.followUps.length > 0 && (
                            <Box pt={1}>
                              <Text fontSize="xs" color="gray.500" mb={1.5}>Refine further:</Text>
                              <Flex gap={1.5} flexWrap="wrap">
                                {message.followUps.map((fp) => (
                                  <Box
                                    key={fp}
                                    as="button"
                                    px={2.5}
                                    py={1}
                                    fontSize="xs"
                                    color="gray.700"
                                    border="1px solid"
                                    borderColor="gray.300"
                                    borderRadius="full"
                                    bg="gray.100"
                                    cursor="pointer"
                                    _hover={{ bg: 'gray.200', borderColor: 'gray.400' }}
                                    onClick={() => handleFollowUp(fp)}
                                    transition="all 0.15s"
                                  >
                                    {fp}
                                  </Box>
                                ))}
                              </Flex>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Button
                          colorScheme="purple"
                          size="sm"
                          mt={1}
                          onClick={() => handleAddAll(message)}
                        >
                          Add all to audience
                        </Button>
                      )}
                    </VStack>
                  )}
                </Box>
              )}
            </Box>
          ))}

          {/* Thinking indicator */}
          {isTyping && (
            <Box>
              <Box
                bg="gray.100"
                px={3}
                py={1.5}
                borderRadius="lg"
                borderBottomLeftRadius="sm"
                display="inline-block"
              >
                <TypingIndicator />
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Input */}
      <Box px={4} py={3} borderTop="1px solid" borderColor="gray.200">
        <Flex gap={2}>
          <Input
            ref={inputRef}
            placeholder="Describe your audience…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            size="sm"
            flex={1}
          />
          <IconButton
            aria-label="Send"
            colorScheme="blue"
            size="sm"
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isTyping}
          >
            <SendIcon style={{ fontSize: '18px' }} />
          </IconButton>
        </Flex>
      </Box>
    </Box>
  );
}
