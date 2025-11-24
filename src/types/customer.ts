/**
 * Customer data types
 */

export interface FactProperties {
  [propertyId: string]: string | number | boolean | Date
}

export interface CustomerFacts {
  [factId: string]: FactProperties  // Facts are always nested objects with properties
}

export interface EngagementProperties {
  [propertyId: string]: string | number | boolean | Date
}

export interface Engagement {
  type: string // engagement ID
  timestamp: string // ISO 8601 date string
  properties: EngagementProperties
}

export interface Customer {
  id: string
  facts: CustomerFacts
  engagements: Engagement[]
}
