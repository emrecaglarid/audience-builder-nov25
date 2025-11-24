/**
 * useAudiences hook - CRUD operations for audiences
 */

import { useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { Audience, ConditionGroup } from '@/types'
import { calculateAudienceSize } from '@/utils/queryEngine'

export function useAudiences() {
  const { audiences, setAudiences, customers } = useApp()

  // Create new audience
  const createAudience = useCallback(
    (name: string, description: string, conditions: ConditionGroup): Audience => {
      const now = new Date().toISOString()
      const size = calculateAudienceSize(customers, conditions)

      const newAudience: Audience = {
        id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        createdAt: now,
        updatedAt: now,
        conditions,
        size,
      }

      setAudiences([...audiences, newAudience])
      return newAudience
    },
    [audiences, customers, setAudiences]
  )

  // Update existing audience
  const updateAudience = useCallback(
    (
      id: string,
      updates: {
        name?: string
        description?: string
        conditions?: ConditionGroup
      }
    ): Audience | null => {
      const audienceIndex = audiences.findIndex((aud) => aud.id === id)
      if (audienceIndex === -1) return null

      const audience = audiences[audienceIndex]
      const updatedConditions = updates.conditions || audience.conditions
      const size = calculateAudienceSize(customers, updatedConditions)

      const updatedAudience: Audience = {
        ...audience,
        ...updates,
        conditions: updatedConditions,
        updatedAt: new Date().toISOString(),
        size,
      }

      const newAudiences = [...audiences]
      newAudiences[audienceIndex] = updatedAudience
      setAudiences(newAudiences)

      return updatedAudience
    },
    [audiences, customers, setAudiences]
  )

  // Delete audience
  const deleteAudience = useCallback(
    (id: string): boolean => {
      const newAudiences = audiences.filter((aud) => aud.id !== id)
      if (newAudiences.length === audiences.length) return false

      setAudiences(newAudiences)
      return true
    },
    [audiences, setAudiences]
  )

  // Get audience by ID
  const getAudience = useCallback(
    (id: string): Audience | null => {
      return audiences.find((aud) => aud.id === id) || null
    },
    [audiences]
  )

  // Recalculate audience size
  const recalculateSize = useCallback(
    (id: string): number | null => {
      const audience = getAudience(id)
      if (!audience) return null

      const size = calculateAudienceSize(customers, audience.conditions)

      // Update the audience with new size
      const audienceIndex = audiences.findIndex((aud) => aud.id === id)
      if (audienceIndex !== -1) {
        const newAudiences = [...audiences]
        newAudiences[audienceIndex] = { ...audience, size }
        setAudiences(newAudiences)
      }

      return size
    },
    [audiences, customers, getAudience, setAudiences]
  )

  return {
    audiences,
    createAudience,
    updateAudience,
    deleteAudience,
    getAudience,
    recalculateSize,
  }
}
