import type { PropertyDefinition } from '@/types';

export interface AISuggestion {
  id: string;
  propertyId: string;
  propertyName: string;
  parentName: string;
  operator: string;
  value: string | number | boolean;
  properties: PropertyDefinition[];
}

interface AISuggestionsResult {
  suggestions: AISuggestion[];
  explanation: string;
}

// Demo mode: Always returns the same 4 rules for any prompt
// This ensures demos work regardless of what the user types
export function getAISuggestions(
  _prompt: string,
  _facts: any[],
  _engagements: any[]
): AISuggestionsResult | null {
  return {
    explanation: 'Demo rule set',
    suggestions: [
      {
        id: `ai-${Date.now()}-1`,
        propertyId: 'gender',
        propertyName: 'Gender',
        parentName: 'Customer Profile',
        operator: 'equals',
        value: 'male',
        properties: [
          { id: 'gender', name: 'Gender', description: 'Customer gender', dataType: 'string', allowedValues: ['male', 'female', 'other'] },
        ],
      },
      {
        id: `ai-${Date.now()}-2`,
        propertyId: 'location_region',
        propertyName: 'Region',
        parentName: 'Customer Profile',
        operator: 'equals',
        value: 'Europe',
        properties: [
          { id: 'location_region', name: 'Region', description: 'Geographic region', dataType: 'string' },
        ],
      },
      {
        id: `ai-${Date.now()}-3`,
        propertyId: 'age',
        propertyName: 'Age',
        parentName: 'Customer Profile',
        operator: 'greaterThan',
        value: 30,
        properties: [
          { id: 'age', name: 'Age', description: 'Customer age', dataType: 'number' },
        ],
      },
      {
        id: `ai-${Date.now()}-4`,
        propertyId: 'total_orders',
        propertyName: 'Total Orders',
        parentName: 'Purchase History',
        operator: 'greaterThanOrEqual',
        value: 3,
        properties: [
          { id: 'total_orders', name: 'Total Orders', description: 'Lifetime number of orders', dataType: 'number' },
        ],
      },
    ],
  };
}

// Detect if input looks like a property search or AI prompt
export function detectInputMode(input: string): 'search' | 'ai' {
  const lowerInput = input.toLowerCase();

  // If it's very short, it's probably a search
  if (input.length < 8) {
    return 'search';
  }

  // Look for AI-like patterns (questions, complex phrases, natural language)
  const aiPatterns = [
    'who ',
    'what ',
    'how ',
    'find ',
    'show ',
    'get ',
    'give me',
    'i want',
    'i need',
    'customers',
    'users',
    'people',
    'with ',
    'that ',
    'have ',
    'high value',
    'high-value',
    'valuable',
    'premium',
    'vip',
    'recent',
    'active',
    'engaged',
    'abandon',
    'cart',
    'new visitor',
    'new customer',
    'first time',
    'email',
    'newsletter',
    'subscrib',
    'location',
    'city',
    'country',
    'region',
    'made a purchase',
    'purchased',
    'bought',
    'completed order',
    'engaged with content',
    'viewed pages',
    'browsed',
    'interacted',
    'inactive',
    'dormant',
    'not active',
    '30+ days',
    '30 days',
    'unsubscribed',
    'unsubscribe',
    'opted out',
  ];

  const hasAiPattern = aiPatterns.some(pattern => lowerInput.includes(pattern));

  // If it contains AI patterns and is reasonably long, treat as AI
  if (hasAiPattern && input.length >= 8) {
    return 'ai';
  }

  // Otherwise, treat as search
  return 'search';
}
