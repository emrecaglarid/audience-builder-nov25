import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { FactDefinition, EngagementDefinition } from '@/types'
import { RuleRow } from './RuleRow'

interface AddedRule {
  id: string
  item: FactDefinition | EngagementDefinition
  type: 'fact' | 'engagement'
  preSelectedProperty?: string // Property ID to pre-select
}

interface DefinitionPaneProps {
  rules: AddedRule[]
  onRemoveRule: (id: string) => void
}

function DefinitionPane({ rules, onRemoveRule }: DefinitionPaneProps) {
  return (
    <Box
      flex={1}
      height="calc(100vh - 64px)"
      overflowY="auto"
      bg="white"
      p={6}
    >
      {rules.length === 0 ? (
        <Flex
          height="100%"
          alignItems="center"
          justifyContent="center"
          color="gray.400"
        >
          <Text>Click on properties from the library to add rules</Text>
        </Flex>
      ) : (
        <VStack align="stretch" gap={3}>
          {rules.map((rule) => {
            const properties = rule.type === 'fact'
              ? (rule.item as FactDefinition).properties
              : (rule.item as EngagementDefinition).properties

            // Get the property name if pre-selected
            const foundProperty = rule.preSelectedProperty
              ? properties.find(p => p.id === rule.preSelectedProperty)
              : null

            const propertyName = foundProperty?.name || rule.item.name

            // Debug logging
            console.log('DefinitionPane - Rule:', {
              ruleId: rule.id,
              parentName: rule.item.name,
              preSelectedPropertyId: rule.preSelectedProperty,
              foundProperty: foundProperty,
              propertyName: propertyName,
              allPropertyIds: properties.map(p => p.id)
            })

            return (
              <RuleRow
                key={rule.id}
                ruleId={rule.id}
                ruleName={propertyName}
                parentName={rule.item.name}
                properties={properties}
                preSelectedProperty={rule.preSelectedProperty}
                sectionId="entry"
                onDelete={() => onRemoveRule(rule.id)}
                onChange={(data) => {
                  // TODO: Store the rule configuration for query building
                  console.log('Rule changed:', rule.id, data)
                }}
              />
            )
          })}
        </VStack>
      )}
    </Box>
  )
}

export default DefinitionPane
export type { AddedRule }
