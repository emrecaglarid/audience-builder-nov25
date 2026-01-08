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
  timestamp: Date;
}

// Format operator for display
function formatOperator(operator: string): string {
  const operatorLabels: Record<string, string> = {
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
  return operatorLabels[operator] || operator;
}

// Format value for display
function formatValue(value: string | number | boolean, operator: string): string {
  if (operator === 'isTrue' || operator === 'isFalse') return '';
  if (operator.startsWith('last') || operator === 'allTime') return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === '') return '';
  return String(value);
}

// Typing indicator component with CSS keyframes
function TypingIndicator() {
  return (
    <>
      <style>
        {`
          @keyframes typingPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
        `}
      </style>
      <Flex align="center" gap={1} py={2}>
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg="gray.400"
          style={{ animation: 'typingPulse 1s ease-in-out infinite' }}
        />
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg="gray.400"
          style={{ animation: 'typingPulse 1s ease-in-out 0.2s infinite' }}
        />
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg="gray.400"
          style={{ animation: 'typingPulse 1s ease-in-out 0.4s infinite' }}
        />
      </Flex>
    </>
  );
}

// Suggestion card component
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
      _hover={!isAdded ? { bg: 'gray.50', borderColor: 'blue.300' } : {}}
      cursor={isAdded ? 'default' : 'pointer'}
      onClick={() => !isAdded && onAdd()}
      transition="all 0.2s"
    >
      <Flex align="center" justify="space-between">
        <Flex align="center" gap={2} flex={1} flexWrap="wrap">
          <Text fontSize="xs" fontWeight="medium" color="gray.700">
            {suggestion.propertyName}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {operatorText}
          </Text>
          {valueText && (
            <Text fontSize="xs" fontWeight="medium" color="blue.600">
              {valueText}
            </Text>
          )}
        </Flex>

        {isAdded ? (
          <Badge colorScheme="green" fontSize="xs">
            Added
          </Badge>
        ) : (
          <Flex
            align="center"
            gap={1}
            color="blue.600"
            fontSize="xs"
            fontWeight="medium"
          >
            <CheckIcon style={{ fontSize: '14px' }} />
            Add
          </Flex>
        )}
      </Flex>

      <Text fontSize="xs" color="gray.400" mt={1}>
        {suggestion.parentName}
      </Text>
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
  // Welcome message
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle initial query from library switch
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, []);

  const handleSend = async (query?: string) => {
    const messageText = query || inputValue;
    if (!messageText.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulate AI thinking
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

    // Generate suggestions
    const result = getAISuggestions(messageText, facts, engagements);
    const suggestions = result?.suggestions || [];

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: suggestions.length > 0
        ? `I built a rule set for "${messageText}". Should we add it, or do you want to refine?`
        : `I couldn't build rules for "${messageText}". Try describing your audience differently, like "high-value customers" or "recent purchasers".`,
      suggestions: suggestions,
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

  const handleAddAllSuggestions = (message: ChatMessage) => {
    if (message.suggestions && message.suggestions.length > 0) {
      onAddSuggestions(activeSectionId, message.suggestions);
      setAddedMessageIds(prev => new Set([...prev, message.id]));
      // Mark all individual suggestions as added too
      const newAddedIds = new Set(addedIds);
      message.suggestions.forEach(s => newAddedIds.add(s.id));
      setAddedIds(newAddedIds);
    }
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
      <Flex
        align="center"
        gap={2}
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <AutoAwesomeIcon style={{ fontSize: '18px', color: '#3182CE' }} />
        <Text fontWeight="semibold" fontSize="md">
          AI Assistant
        </Text>
      </Flex>

      {/* Messages Area */}
      <Box flex={1} overflowY="auto" px={4} py={3}>
        <VStack align="stretch" gap={3}>
          {messages.map((message) => (
            <Box key={message.id}>
              {message.role === 'user' ? (
                // User message - right aligned
                <Flex justify="flex-end">
                  <Box
                    maxW="85%"
                    bg="blue.500"
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
                // AI message - left aligned
                <Box maxW="100%">
                  <Box
                    bg="gray.100"
                    px={3}
                    py={2}
                    borderRadius="lg"
                    borderBottomLeftRadius="sm"
                    mb={message.suggestions && message.suggestions.length > 0 ? 2 : 0}
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

                      {/* Add all button or confirmation */}
                      {addedMessageIds.has(message.id) ? (
                        <Flex align="center" gap={1} py={2} color="green.600" fontSize="sm" fontWeight="medium">
                          <CheckIcon style={{ fontSize: '16px' }} />
                          Added {message.suggestions.length} rules
                        </Flex>
                      ) : (
                        <Button
                          colorScheme="blue"
                          size="sm"
                          mt={1}
                          onClick={() => handleAddAllSuggestions(message)}
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

          {/* Typing indicator */}
          {isTyping && (
            <Box>
              <Box
                bg="gray.100"
                px={3}
                py={1}
                borderRadius="lg"
                borderBottomLeftRadius="sm"
                display="inline-block"
              >
                <TypingIndicator />
              </Box>
            </Box>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Input Area */}
      <Box px={4} py={3} borderTop="1px solid" borderColor="gray.200">
        <Flex gap={2}>
          <Input
            placeholder="Describe your audience..."
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
