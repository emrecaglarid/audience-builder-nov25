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

type ScenarioTemplate = {
  keywords: string[];
  explanation: string;
  suggestions: Omit<AISuggestion, 'id'>[];
};

const SCENARIOS: ScenarioTemplate[] = [
  {
    keywords: ['high value', 'high-value', 'vip', 'premium', 'loyal', 'top customers', 'best customers', 'valuable', 'big spender'],
    explanation: 'High-value customer segment',
    suggestions: [
      {
        propertyId: 'lifetime_value',
        propertyName: 'Lifetime Value',
        parentName: 'Purchase History',
        operator: 'greaterThan',
        value: 500,
        properties: [{ id: 'lifetime_value', name: 'Lifetime Value', description: 'Total amount spent in USD', dataType: 'number' }],
      },
      {
        propertyId: 'tier',
        propertyName: 'Tier',
        parentName: 'Membership Status',
        operator: 'equals',
        value: 'gold',
        properties: [{ id: 'tier', name: 'Tier', description: 'Membership tier level', dataType: 'string', allowedValues: ['bronze', 'silver', 'gold', 'platinum'] }],
      },
      {
        propertyId: 'total_orders',
        propertyName: 'Total Orders',
        parentName: 'Purchase History',
        operator: 'greaterThan',
        value: 10,
        properties: [{ id: 'total_orders', name: 'Total Orders', description: 'Lifetime number of orders', dataType: 'number' }],
      },
      {
        propertyId: 'average_order_value',
        propertyName: 'Average Order Value',
        parentName: 'Purchase History',
        operator: 'greaterThan',
        value: 100,
        properties: [{ id: 'average_order_value', name: 'Average Order Value', description: 'Average spend per order', dataType: 'number' }],
      },
    ],
  },
  {
    keywords: ['lapsed', 'inactive', 'dormant', 'win back', 'winback', 're-engage', 'churned', 'not active', "haven't purchased", 'havent purchased', 'lost customer'],
    explanation: 'Lapsed customer win-back segment',
    suggestions: [
      {
        propertyId: 'last_purchase_date',
        propertyName: 'Last Purchase Date',
        parentName: 'Purchase History',
        operator: 'before',
        value: '90 days ago',
        properties: [{ id: 'last_purchase_date', name: 'Last Purchase Date', description: 'Date of most recent purchase', dataType: 'date' }],
      },
      {
        propertyId: 'total_orders',
        propertyName: 'Total Orders',
        parentName: 'Purchase History',
        operator: 'greaterThanOrEqual',
        value: 1,
        properties: [{ id: 'total_orders', name: 'Total Orders', description: 'Lifetime number of orders', dataType: 'number' }],
      },
      {
        propertyId: 'email_subscribed',
        propertyName: 'Email Subscribed',
        parentName: 'Customer Profile',
        operator: 'isTrue',
        value: true,
        properties: [{ id: 'email_subscribed', name: 'Email Subscribed', description: 'Marketing email subscription', dataType: 'boolean' }],
      },
      {
        propertyId: 'email_open_rate',
        propertyName: 'Email Open Rate',
        parentName: 'Engagement Metrics',
        operator: 'lessThan',
        value: 0.2,
        properties: [{ id: 'email_open_rate', name: 'Email Open Rate', description: 'Email engagement rate', dataType: 'number' }],
      },
    ],
  },
  {
    keywords: ['cart', 'abandon', 'basket', 'added to cart', 'product view', 'browsing', 'browse and bail'],
    explanation: 'Cart abandonment recovery segment',
    suggestions: [
      {
        propertyId: 'cart_abandonment_rate',
        propertyName: 'Cart Abandonment Rate',
        parentName: 'Engagement Metrics',
        operator: 'greaterThan',
        value: 0.5,
        properties: [{ id: 'cart_abandonment_rate', name: 'Cart Abandonment Rate', description: 'Percentage of abandoned carts', dataType: 'number' }],
      },
      {
        propertyId: 'product_views',
        propertyName: 'Product Views',
        parentName: 'Engagement Metrics',
        operator: 'greaterThan',
        value: 5,
        properties: [{ id: 'product_views', name: 'Product Views', description: 'Total products viewed', dataType: 'number' }],
      },
      {
        propertyId: 'email_subscribed',
        propertyName: 'Email Subscribed',
        parentName: 'Customer Profile',
        operator: 'isTrue',
        value: true,
        properties: [{ id: 'email_subscribed', name: 'Email Subscribed', description: 'Marketing email subscription', dataType: 'boolean' }],
      },
    ],
  },
  {
    keywords: ['email', 'newsletter', 'subscribe', 'subscribed', 'open rate', 'engaged with email', 'email engagement', 'mailing list'],
    explanation: 'Email-engaged subscriber segment',
    suggestions: [
      {
        propertyId: 'email_subscribed',
        propertyName: 'Email Subscribed',
        parentName: 'Customer Profile',
        operator: 'isTrue',
        value: true,
        properties: [{ id: 'email_subscribed', name: 'Email Subscribed', description: 'Marketing email subscription', dataType: 'boolean' }],
      },
      {
        propertyId: 'email_open_rate',
        propertyName: 'Email Open Rate',
        parentName: 'Engagement Metrics',
        operator: 'greaterThan',
        value: 0.4,
        properties: [{ id: 'email_open_rate', name: 'Email Open Rate', description: 'Email engagement rate', dataType: 'number' }],
      },
      {
        propertyId: 'last_visit_date',
        propertyName: 'Last Visit Date',
        parentName: 'Engagement Metrics',
        operator: 'after',
        value: '30 days ago',
        properties: [{ id: 'last_visit_date', name: 'Last Visit Date', description: 'Most recent site visit', dataType: 'date' }],
      },
    ],
  },
  {
    keywords: ['narrow by recency', 'add recency', 'recency', 'recent purchase', 'recently active', 'recently bought'],
    explanation: 'Recency filter',
    suggestions: [
      {
        propertyId: 'last_purchase_date',
        propertyName: 'Last Purchase Date',
        parentName: 'Purchase History',
        operator: 'after',
        value: '60 days ago',
        properties: [{ id: 'last_purchase_date', name: 'Last Purchase Date', description: 'Date of most recent purchase', dataType: 'date' }],
      },
      {
        propertyId: 'last_visit_date',
        propertyName: 'Last Visit Date',
        parentName: 'Engagement Metrics',
        operator: 'after',
        value: '14 days ago',
        properties: [{ id: 'last_visit_date', name: 'Last Visit Date', description: 'Most recent site visit', dataType: 'date' }],
      },
    ],
  },
  {
    keywords: ['add location', 'location filter', 'narrow by location', 'location', 'region', 'geography', 'country'],
    explanation: 'Location filter',
    suggestions: [
      {
        propertyId: 'location_region',
        propertyName: 'Location Region',
        parentName: 'Customer Profile',
        operator: 'equals',
        value: 'Europe',
        properties: [{ id: 'location_region', name: 'Location Region', description: 'Geographic region', dataType: 'string' }],
      },
      {
        propertyId: 'country',
        propertyName: 'Country',
        parentName: 'Customer Profile',
        operator: 'equals',
        value: 'Netherlands',
        properties: [{ id: 'country', name: 'Country', description: 'Country of residence', dataType: 'string' }],
      },
    ],
  },
  {
    keywords: ['email engagement', 'filter by email', 'email open', 'email activity', 'email interaction'],
    explanation: 'Email engagement filter',
    suggestions: [
      {
        propertyId: 'email_subscribed',
        propertyName: 'Email Subscribed',
        parentName: 'Customer Profile',
        operator: 'isTrue',
        value: true,
        properties: [{ id: 'email_subscribed', name: 'Email Subscribed', description: 'Marketing email subscription', dataType: 'boolean' }],
      },
      {
        propertyId: 'email_open_rate',
        propertyName: 'Email Open Rate',
        parentName: 'Engagement Metrics',
        operator: 'greaterThan',
        value: 0.4,
        properties: [{ id: 'email_open_rate', name: 'Email Open Rate', description: 'Email engagement rate', dataType: 'number' }],
      },
      {
        propertyId: 'email_click_rate',
        propertyName: 'Email Click Rate',
        parentName: 'Engagement Metrics',
        operator: 'greaterThan',
        value: 0.1,
        properties: [{ id: 'email_click_rate', name: 'Email Click Rate', description: 'Click-through rate on emails', dataType: 'number' }],
      },
    ],
  },
  {
    keywords: ['add spending', 'spending history', 'spending threshold', 'spend threshold', 'order value', 'purchase value', 'spending'],
    explanation: 'Spending history filter',
    suggestions: [
      {
        propertyId: 'lifetime_value',
        propertyName: 'Lifetime Value',
        parentName: 'Purchase History',
        operator: 'greaterThan',
        value: 200,
        properties: [{ id: 'lifetime_value', name: 'Lifetime Value', description: 'Total amount spent in USD', dataType: 'number' }],
      },
      {
        propertyId: 'average_order_value',
        propertyName: 'Average Order Value',
        parentName: 'Purchase History',
        operator: 'greaterThan',
        value: 75,
        properties: [{ id: 'average_order_value', name: 'Average Order Value', description: 'Average spend per order', dataType: 'number' }],
      },
      {
        propertyId: 'total_orders',
        propertyName: 'Total Orders',
        parentName: 'Purchase History',
        operator: 'greaterThanOrEqual',
        value: 2,
        properties: [{ id: 'total_orders', name: 'Total Orders', description: 'Lifetime number of orders', dataType: 'number' }],
      },
    ],
  },
  {
    keywords: ['visit frequency', 'narrow by visit', 'session', 'sessions', 'page views', 'site visits', 'browsing frequency'],
    explanation: 'Visit frequency filter',
    suggestions: [
      {
        propertyId: 'product_views',
        propertyName: 'Product Views',
        parentName: 'Engagement Metrics',
        operator: 'greaterThan',
        value: 3,
        properties: [{ id: 'product_views', name: 'Product Views', description: 'Total products viewed', dataType: 'number' }],
      },
      {
        propertyId: 'session_count',
        propertyName: 'Session Count',
        parentName: 'Engagement Metrics',
        operator: 'greaterThan',
        value: 5,
        properties: [{ id: 'session_count', name: 'Session Count', description: 'Total number of site sessions', dataType: 'number' }],
      },
    ],
  },
  {
    keywords: ['purchase history', 'narrow by purchase', 'bought before', 'past purchases', 'shopping history'],
    explanation: 'Purchase history filter',
    suggestions: [
      {
        propertyId: 'total_orders',
        propertyName: 'Total Orders',
        parentName: 'Purchase History',
        operator: 'greaterThanOrEqual',
        value: 2,
        properties: [{ id: 'total_orders', name: 'Total Orders', description: 'Lifetime number of orders', dataType: 'number' }],
      },
      {
        propertyId: 'last_purchase_date',
        propertyName: 'Last Purchase Date',
        parentName: 'Purchase History',
        operator: 'after',
        value: '90 days ago',
        properties: [{ id: 'last_purchase_date', name: 'Last Purchase Date', description: 'Date of most recent purchase', dataType: 'date' }],
      },
      {
        propertyId: 'average_order_value',
        propertyName: 'Average Order Value',
        parentName: 'Purchase History',
        operator: 'greaterThan',
        value: 50,
        properties: [{ id: 'average_order_value', name: 'Average Order Value', description: 'Average spend per order', dataType: 'number' }],
      },
    ],
  },
  {
    keywords: ['demographic', 'add demographic', 'demographic filter', 'age filter', 'gender filter', 'age group'],
    explanation: 'Demographic filter',
    suggestions: [
      {
        propertyId: 'age',
        propertyName: 'Age',
        parentName: 'Customer Profile',
        operator: 'greaterThan',
        value: 25,
        properties: [{ id: 'age', name: 'Age', description: 'Customer age in years', dataType: 'number' }],
      },
      {
        propertyId: 'gender',
        propertyName: 'Gender',
        parentName: 'Customer Profile',
        operator: 'equals',
        value: 'female',
        properties: [{ id: 'gender', name: 'Gender', description: 'Customer gender', dataType: 'string', allowedValues: ['male', 'female', 'non-binary', 'prefer-not-to-say'] }],
      },
      {
        propertyId: 'location_region',
        propertyName: 'Location Region',
        parentName: 'Customer Profile',
        operator: 'equals',
        value: 'Europe',
        properties: [{ id: 'location_region', name: 'Location Region', description: 'Geographic region', dataType: 'string' }],
      },
    ],
  },
];

// Default: demographic + behavioral combo
const DEFAULT_SUGGESTIONS: Omit<AISuggestion, 'id'>[] = [
  {
    propertyId: 'gender',
    propertyName: 'Gender',
    parentName: 'Customer Profile',
    operator: 'equals',
    value: 'male',
    properties: [{ id: 'gender', name: 'Gender', description: 'Customer gender', dataType: 'string', allowedValues: ['male', 'female', 'non-binary', 'prefer-not-to-say'] }],
  },
  {
    propertyId: 'location_region',
    propertyName: 'Location Region',
    parentName: 'Customer Profile',
    operator: 'equals',
    value: 'Europe',
    properties: [{ id: 'location_region', name: 'Location Region', description: 'Geographic region', dataType: 'string' }],
  },
  {
    propertyId: 'age',
    propertyName: 'Age',
    parentName: 'Customer Profile',
    operator: 'greaterThan',
    value: 30,
    properties: [{ id: 'age', name: 'Age', description: 'Customer age in years', dataType: 'number' }],
  },
  {
    propertyId: 'total_orders',
    propertyName: 'Total Orders',
    parentName: 'Purchase History',
    operator: 'greaterThanOrEqual',
    value: 3,
    properties: [{ id: 'total_orders', name: 'Total Orders', description: 'Lifetime number of orders', dataType: 'number' }],
  },
];

export function getAISuggestions(
  prompt: string,
  _facts: any[],
  _engagements: any[]
): AISuggestionsResult | null {
  const lower = prompt.toLowerCase();
  const matched = SCENARIOS.find(s => s.keywords.some(k => lower.includes(k)));

  const base = matched
    ? { explanation: matched.explanation, suggestions: matched.suggestions }
    : { explanation: 'Suggested audience criteria', suggestions: DEFAULT_SUGGESTIONS };

  const suggestions: AISuggestion[] = base.suggestions.map((s, i) => ({
    ...s,
    id: `ai-${Date.now()}-${i}`,
  }));

  return { explanation: base.explanation, suggestions };
}

// Detect if input looks like a property search or natural-language prompt
export function detectInputMode(input: string): 'search' | 'ai' {
  const lower = input.toLowerCase();

  if (input.length < 8) return 'search';

  const aiPatterns = [
    'who ', 'what ', 'how ', 'find ', 'show ', 'get ', 'give me',
    'i want', 'i need', 'customers', 'users', 'people',
    'with ', 'that ', 'have ', 'high value', 'high-value', 'valuable',
    'premium', 'vip', 'recent', 'active', 'engaged', 'abandon', 'cart',
    'new visitor', 'new customer', 'first time', 'email', 'newsletter',
    'subscrib', 'location', 'city', 'country', 'region',
    'made a purchase', 'purchased', 'bought', 'completed order',
    'engaged with content', 'viewed pages', 'browsed', 'interacted',
    'inactive', 'dormant', 'not active', '30+ days', '30 days',
    'unsubscribed', 'unsubscribe', 'opted out',
    'over ', 'under ', 'more than', 'less than', 'at least',
    'repeat', 'returning', 'lapsed', 'churned',
  ];

  if (aiPatterns.some(p => lower.includes(p))) return 'ai';
  return 'search';
}
