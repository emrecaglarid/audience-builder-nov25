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

// Hardcoded AI suggestions based on natural language patterns
export function getAISuggestions(
  prompt: string,
  facts: any[],
  engagements: any[]
): AISuggestionsResult | null {
  const lowerPrompt = prompt.toLowerCase();

  // Pattern 1: High-value customers
  if (
    lowerPrompt.includes('high value') ||
    lowerPrompt.includes('high-value') ||
    lowerPrompt.includes('valuable') ||
    lowerPrompt.includes('premium') ||
    lowerPrompt.includes('vip')
  ) {
    const ltv = facts.find(f => f.id === 'lifetime-value');
    const orders = facts.find(f => f.id === 'order-count');
    const engagement = engagements.find(e => e.id === 'purchase');

    if (!ltv || !orders || !engagement) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const ltvProp = ltv.properties.find((p: PropertyDefinition) => p.id === 'total-value');
    const ordersProp = orders.properties.find((p: PropertyDefinition) => p.id === 'count');
    const timestampProp = engagement.properties.find((p: PropertyDefinition) => p.id === 'timestamp');

    if (!ltvProp || !ordersProp || !timestampProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Identifying high-value customers based on lifetime value, order frequency, and recent activity',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: ltvProp.id,
          propertyName: ltvProp.name,
          parentName: ltv.name,
          operator: 'greaterThan',
          value: 1000,
          properties: ltv.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: ordersProp.id,
          propertyName: ordersProp.name,
          parentName: orders.name,
          operator: 'greaterThanOrEqual',
          value: 5,
          properties: orders.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: timestampProp.id,
          propertyName: timestampProp.name,
          parentName: engagement.name,
          operator: 'last30days',
          value: '',
          properties: engagement.properties,
        },
      ],
    };
  }

  // Pattern 2: Recently active/engaged users
  if (
    lowerPrompt.includes('recent') ||
    lowerPrompt.includes('active') ||
    lowerPrompt.includes('engaged')
  ) {
    const pageView = engagements.find(e => e.id === 'page-view');
    const orders = facts.find(f => f.id === 'order-count');
    const contact = facts.find(f => f.id === 'contact-info');

    if (!pageView || !orders || !contact) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const timestampProp = pageView.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const ordersProp = orders.properties.find((p: PropertyDefinition) => p.id === 'count');
    const emailProp = contact.properties.find((p: PropertyDefinition) => p.id === 'email-subscribed');

    if (!timestampProp || !ordersProp || !emailProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Finding recently active users who are engaged with page views and email',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: timestampProp.id,
          propertyName: timestampProp.name,
          parentName: pageView.name,
          operator: 'last7days',
          value: '',
          properties: pageView.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: ordersProp.id,
          propertyName: ordersProp.name,
          parentName: orders.name,
          operator: 'greaterThanOrEqual',
          value: 1,
          properties: orders.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: emailProp.id,
          propertyName: emailProp.name,
          parentName: contact.name,
          operator: 'isTrue',
          value: true,
          properties: contact.properties,
        },
      ],
    };
  }

  // Pattern 3: Cart abandoners
  if (
    lowerPrompt.includes('abandon') ||
    lowerPrompt.includes('cart') ||
    (lowerPrompt.includes('didn') && lowerPrompt.includes('purchase'))
  ) {
    const addToCart = engagements.find(e => e.id === 'add-to-cart');
    const contact = facts.find(f => f.id === 'contact-info');
    const ltv = facts.find(f => f.id === 'lifetime-value');

    if (!addToCart || !contact || !ltv) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const cartTimestamp = addToCart.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const emailProp = contact.properties.find((p: PropertyDefinition) => p.id === 'email-subscribed');
    const ltvProp = ltv.properties.find((p: PropertyDefinition) => p.id === 'total-value');

    if (!cartTimestamp || !emailProp || !ltvProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Targeting cart abandoners who are reachable via email',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: cartTimestamp.id,
          propertyName: cartTimestamp.name,
          parentName: addToCart.name,
          operator: 'last7days',
          value: '',
          properties: addToCart.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: emailProp.id,
          propertyName: emailProp.name,
          parentName: contact.name,
          operator: 'isTrue',
          value: true,
          properties: contact.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: ltvProp.id,
          propertyName: ltvProp.name,
          parentName: ltv.name,
          operator: 'greaterThan',
          value: 0,
          properties: ltv.properties,
        },
      ],
    };
  }

  // Pattern 4: New visitors
  if (
    lowerPrompt.includes('new visitor') ||
    lowerPrompt.includes('new customer') ||
    lowerPrompt.includes('first time')
  ) {
    const orders = facts.find(f => f.id === 'order-count');
    const pageView = engagements.find(e => e.id === 'page-view');
    const contact = facts.find(f => f.id === 'contact-info');

    if (!orders || !pageView || !contact) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const ordersProp = orders.properties.find((p: PropertyDefinition) => p.id === 'count');
    const timestampProp = pageView.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const emailProp = contact.properties.find((p: PropertyDefinition) => p.id === 'email-subscribed');

    if (!ordersProp || !timestampProp || !emailProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Identifying new visitors who are recently active',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: ordersProp.id,
          propertyName: ordersProp.name,
          parentName: orders.name,
          operator: 'equals',
          value: 0,
          properties: orders.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: timestampProp.id,
          propertyName: timestampProp.name,
          parentName: pageView.name,
          operator: 'last30days',
          value: '',
          properties: pageView.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: emailProp.id,
          propertyName: emailProp.name,
          parentName: contact.name,
          operator: 'isTrue',
          value: true,
          properties: contact.properties,
        },
      ],
    };
  }

  // Pattern 5: Email subscribers
  if (
    lowerPrompt.includes('email') ||
    lowerPrompt.includes('newsletter') ||
    lowerPrompt.includes('subscrib')
  ) {
    const contact = facts.find(f => f.id === 'contact-info');
    const pageView = engagements.find(e => e.id === 'page-view');
    const orders = facts.find(f => f.id === 'order-count');

    if (!contact || !pageView || !orders) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const emailProp = contact.properties.find((p: PropertyDefinition) => p.id === 'email-subscribed');
    const timestampProp = pageView.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const ordersProp = orders.properties.find((p: PropertyDefinition) => p.id === 'count');

    if (!emailProp || !timestampProp || !ordersProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Targeting active email subscribers with recent engagement',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: emailProp.id,
          propertyName: emailProp.name,
          parentName: contact.name,
          operator: 'isTrue',
          value: true,
          properties: contact.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: timestampProp.id,
          propertyName: timestampProp.name,
          parentName: pageView.name,
          operator: 'last30days',
          value: '',
          properties: pageView.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: ordersProp.id,
          propertyName: ordersProp.name,
          parentName: orders.name,
          operator: 'greaterThanOrEqual',
          value: 1,
          properties: orders.properties,
        },
      ],
    };
  }

  // Pattern 6: Location-based
  if (
    lowerPrompt.includes('location') ||
    lowerPrompt.includes('city') ||
    lowerPrompt.includes('country') ||
    lowerPrompt.includes('region')
  ) {
    const contact = facts.find(f => f.id === 'contact-info');
    const pageView = engagements.find(e => e.id === 'page-view');
    const orders = facts.find(f => f.id === 'order-count');

    if (!contact || !pageView || !orders) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const countryProp = contact.properties.find((p: PropertyDefinition) => p.id === 'country');
    const timestampProp = pageView.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const ordersProp = orders.properties.find((p: PropertyDefinition) => p.id === 'count');

    if (!countryProp || !timestampProp || !ordersProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Targeting users in a specific location with recent activity',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: countryProp.id,
          propertyName: countryProp.name,
          parentName: contact.name,
          operator: 'equals',
          value: 'US',
          properties: contact.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: timestampProp.id,
          propertyName: timestampProp.name,
          parentName: pageView.name,
          operator: 'last30days',
          value: '',
          properties: pageView.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: ordersProp.id,
          propertyName: ordersProp.name,
          parentName: orders.name,
          operator: 'greaterThanOrEqual',
          value: 1,
          properties: orders.properties,
        },
      ],
    };
  }

  // Pattern 7: Made a purchase (for Goals section)
  if (
    lowerPrompt.includes('made a purchase') ||
    lowerPrompt.includes('purchased') ||
    lowerPrompt.includes('bought') ||
    lowerPrompt.includes('completed order')
  ) {
    const purchase = engagements.find(e => e.id === 'purchase');
    const purchaseHistory = facts.find(f => f.id === 'purchaseHistory');

    if (!purchase || !purchaseHistory) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const timestampProp = purchase.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const ordersProp = purchaseHistory.properties.find((p: PropertyDefinition) => p.id === 'total_orders');
    const ltvProp = purchaseHistory.properties.find((p: PropertyDefinition) => p.id === 'lifetime_value');

    if (!timestampProp || !ordersProp || !ltvProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Identifying users who completed a purchase',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: timestampProp.id,
          propertyName: timestampProp.name,
          parentName: purchase.name,
          operator: 'last30days',
          value: '',
          properties: purchase.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: ordersProp.id,
          propertyName: ordersProp.name,
          parentName: purchaseHistory.name,
          operator: 'greaterThanOrEqual',
          value: 1,
          properties: purchaseHistory.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: ltvProp.id,
          propertyName: ltvProp.name,
          parentName: purchaseHistory.name,
          operator: 'greaterThan',
          value: 0,
          properties: purchaseHistory.properties,
        },
      ],
    };
  }

  // Pattern 8: Engaged with content (for Goals section)
  if (
    lowerPrompt.includes('engaged with content') ||
    lowerPrompt.includes('viewed pages') ||
    lowerPrompt.includes('browsed') ||
    lowerPrompt.includes('interacted')
  ) {
    const siteVisit = engagements.find(e => e.id === 'siteVisit');
    const emailOpen = engagements.find(e => e.id === 'emailOpen');
    const productView = engagements.find(e => e.id === 'productView');

    if (!siteVisit || !emailOpen || !productView) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const siteTimestampProp = siteVisit.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const emailTimestampProp = emailOpen.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const productTimestampProp = productView.properties.find((p: PropertyDefinition) => p.id === 'timestamp');

    if (!siteTimestampProp || !emailTimestampProp || !productTimestampProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Identifying users who engaged with your content',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: siteTimestampProp.id,
          propertyName: siteTimestampProp.name,
          parentName: siteVisit.name,
          operator: 'last30days',
          value: '',
          properties: siteVisit.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: emailTimestampProp.id,
          propertyName: emailTimestampProp.name,
          parentName: emailOpen.name,
          operator: 'last30days',
          value: '',
          properties: emailOpen.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: productTimestampProp.id,
          propertyName: productTimestampProp.name,
          parentName: productView.name,
          operator: 'last30days',
          value: '',
          properties: productView.properties,
        },
      ],
    };
  }

  // Pattern 9: Inactive for 30+ days (for Exit section)
  if (
    lowerPrompt.includes('inactive') ||
    lowerPrompt.includes('dormant') ||
    lowerPrompt.includes('not active') ||
    lowerPrompt.includes('30+ days') ||
    lowerPrompt.includes('30 days')
  ) {
    const siteVisit = engagements.find(e => e.id === 'siteVisit');
    const purchase = engagements.find(e => e.id === 'purchase');
    const emailOpen = engagements.find(e => e.id === 'emailOpen');

    if (!siteVisit || !purchase || !emailOpen) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const siteTimestampProp = siteVisit.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const purchaseTimestampProp = purchase.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const emailTimestampProp = emailOpen.properties.find((p: PropertyDefinition) => p.id === 'timestamp');

    if (!siteTimestampProp || !purchaseTimestampProp || !emailTimestampProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Identifying users who have been inactive for 30+ days',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: siteTimestampProp.id,
          propertyName: siteTimestampProp.name,
          parentName: siteVisit.name,
          operator: 'notLast30days',
          value: '',
          properties: siteVisit.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: purchaseTimestampProp.id,
          propertyName: purchaseTimestampProp.name,
          parentName: purchase.name,
          operator: 'notLast30days',
          value: '',
          properties: purchase.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: emailTimestampProp.id,
          propertyName: emailTimestampProp.name,
          parentName: emailOpen.name,
          operator: 'notLast30days',
          value: '',
          properties: emailOpen.properties,
        },
      ],
    };
  }

  // Pattern 10: Unsubscribed from emails (for Exit section)
  if (
    lowerPrompt.includes('unsubscribed') ||
    lowerPrompt.includes('unsubscribe') ||
    lowerPrompt.includes('opted out') ||
    lowerPrompt.includes('no longer subscribed')
  ) {
    const customerProfile = facts.find(f => f.id === 'customerProfile');
    const emailOpen = engagements.find(e => e.id === 'emailOpen');
    const purchaseHistory = facts.find(f => f.id === 'purchaseHistory');

    if (!customerProfile || !emailOpen || !purchaseHistory) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    const emailProp = customerProfile.properties.find((p: PropertyDefinition) => p.id === 'email_subscribed');
    const emailTimestampProp = emailOpen.properties.find((p: PropertyDefinition) => p.id === 'timestamp');
    const ordersProp = purchaseHistory.properties.find((p: PropertyDefinition) => p.id === 'total_orders');

    if (!emailProp || !emailTimestampProp || !ordersProp) {
      return {
        suggestions: [],
        explanation: "I need more data to generate suggestions for this pattern. Make sure your facts and engagements are loaded.",
      };
    }

    return {
      explanation: 'Identifying users who unsubscribed from email communications',
      suggestions: [
        {
          id: `ai-${Date.now()}-1`,
          propertyId: emailProp.id,
          propertyName: emailProp.name,
          parentName: customerProfile.name,
          operator: 'isFalse',
          value: false,
          properties: customerProfile.properties,
        },
        {
          id: `ai-${Date.now()}-2`,
          propertyId: emailTimestampProp.id,
          propertyName: emailTimestampProp.name,
          parentName: emailOpen.name,
          operator: 'notLast90days',
          value: '',
          properties: emailOpen.properties,
        },
        {
          id: `ai-${Date.now()}-3`,
          propertyId: ordersProp.id,
          propertyName: ordersProp.name,
          parentName: purchaseHistory.name,
          operator: 'greaterThanOrEqual',
          value: 1,
          properties: purchaseHistory.properties,
        },
      ],
    };
  }

  // No pattern matched - return helpful message
  return {
    suggestions: [],
    explanation: "I don't recognize this pattern yet. Try prompts like: 'high value customers', 'new visitors', 'cart abandoners', 'made a purchase', 'engaged with content', 'inactive for 30+ days', or 'unsubscribed from emails'.",
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
    // Pattern 1 keywords (high-value customers)
    'high value',
    'high-value',
    'valuable',
    'premium',
    'vip',
    // Pattern 2 keywords (recently active/engaged)
    'recent',
    'active',
    'engaged',
    // Pattern 3 keywords (cart abandoners)
    'abandon',
    'cart',
    // Pattern 4 keywords (new visitors)
    'new visitor',
    'new customer',
    'first time',
    // Pattern 5 keywords (email subscribers)
    'email',
    'newsletter',
    'subscrib',
    // Pattern 6 keywords (location-based)
    'location',
    'city',
    'country',
    'region',
    // Pattern 7 keywords (made a purchase)
    'made a purchase',
    'purchased',
    'bought',
    'completed order',
    // Pattern 8 keywords (engaged with content)
    'engaged with content',
    'viewed pages',
    'browsed',
    'interacted',
    // Pattern 9 keywords (inactive)
    'inactive',
    'dormant',
    'not active',
    '30+ days',
    '30 days',
    // Pattern 10 keywords (unsubscribed)
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
