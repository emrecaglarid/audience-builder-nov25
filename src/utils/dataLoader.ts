/**
 * Data Loader - Loads industry data from JSON files
 */

import { IndustrySchema, Customer, Audience } from '@/types'

export type IndustryId = 'ecommerce' | 'airlines' | 'insurance'

export interface IndustryData {
  schema: IndustrySchema
  customers: Customer[]
  audiences: Audience[]
}

// Load industry data
export async function loadIndustryData(industryId: IndustryId): Promise<IndustryData> {
  try {
    const [schema, customers, audiences] = await Promise.all([
      import(`@/data/industries/${industryId}/schema.json`),
      import(`@/data/industries/${industryId}/customers.json`),
      import(`@/data/industries/${industryId}/audiences.json`),
    ])

    return {
      schema: schema.default || schema,
      customers: customers.default || customers,
      audiences: audiences.default || audiences,
    }
  } catch (error) {
    console.error(`Failed to load industry data for ${industryId}:`, error)
    throw error
  }
}

// Get available industries
export function getAvailableIndustries(): { id: IndustryId; name: string }[] {
  return [
    { id: 'ecommerce', name: 'E-commerce' },
    { id: 'airlines', name: 'Airlines' },
    { id: 'insurance', name: 'Insurance' },
  ]
}
