import { useApp } from '@/context/AppContext'
import LibraryPane from './LibraryPane'

interface LibraryPaneWrapperProps {
  recentlyUsed: any[]
  onPropertyClick: (sectionId: string, match: any) => void
  activeSectionId: string
  activeSectionName: string
}

export default function LibraryPaneWrapper({
  recentlyUsed,
  onPropertyClick,
  activeSectionId,
  activeSectionName
}: LibraryPaneWrapperProps) {
  const { schema } = useApp()

  if (!schema) {
    return null
  }

  return (
    <LibraryPane
      facts={schema.facts}
      engagements={schema.engagements}
      recentlyUsed={recentlyUsed || []}
      isVisible={true}
      activeSectionId={activeSectionId}
      activeSectionName={activeSectionName}
      isEngagementsOnly={activeSectionId === 'goals' || activeSectionId === 'exit'}
      onItemClick={() => {}}
      onPropertyClick={(propertyRef) => {
        // Call the prop function with the section ID and property match format
        if (onPropertyClick) {
          const match = {
            type: propertyRef.type,
            parentId: propertyRef.parentId,
            parentName: propertyRef.parentName,
            property: propertyRef.property,
          }
          onPropertyClick(activeSectionId, match)
        }
      }}
    />
  )
}