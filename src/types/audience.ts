/**
 * Audience types
 */

import { ConditionGroup } from './query'

export interface Audience {
  id: string
  name: string
  description: string
  createdAt: string // ISO 8601 date string
  updatedAt: string // ISO 8601 date string
  conditions: ConditionGroup
  size?: number // calculated field
}

export interface AudienceListItem {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  size: number
}
