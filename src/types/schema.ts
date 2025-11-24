/**
 * Schema types - Define the structure of facts and engagements
 */

export type DataType = 'string' | 'number' | 'boolean' | 'date'

export interface PropertyDefinition {
  id: string
  name: string
  description: string
  dataType: DataType
  allowedValues?: string[] | number[]
}

export interface FactDefinition {
  id: string
  name: string
  description: string
  category?: string
  properties: PropertyDefinition[]  // Facts are always nested objects with properties
}

export interface EngagementDefinition {
  id: string
  name: string
  description: string
  properties: PropertyDefinition[]
}

export interface IndustrySchema {
  industryName: string
  industryId: string
  facts: FactDefinition[]
  engagements: EngagementDefinition[]
}

// Reference to a specific property within a fact or engagement
export interface PropertyReference {
  type: 'fact' | 'engagement'
  parentId: string // fact or engagement ID
  parentName: string // fact or engagement name
  property: PropertyDefinition
}
