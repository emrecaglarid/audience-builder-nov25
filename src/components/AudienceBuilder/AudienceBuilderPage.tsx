import { useParams } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import { getAudience, saveAudience } from '../../services/audienceStorage';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DropAnimation } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useApp } from '@/context/AppContext';
import { PropertyReference, PropertyDefinition } from '@/types';
import EditorHeader from './EditorHeader';
import LibraryPane from './LibraryPane';
import { Canvas } from './Canvas';
import PreviewPane, { PreviewTimePeriod } from './PreviewPane';
import { ToolbarPane } from './Toolbar';
import { MatchType, TimePeriod } from './CriteriaSection';
import type { PropertyMatch } from './PropertyDropdown';
import type { AISuggestion } from './aiSuggestions';
import { calculateAudienceSize } from '@/utils/queryEngine';
import { sectionsToConditionGroup } from '@/utils/audienceQueryBuilder';
import type { AddedDestination, Destination } from '../../types/destination';
import { AudienceSummary } from './ViewMode/AudienceSummary';
import { Dashboard } from './ViewMode/Dashboard';

interface AddedRule {
  id: string;
  propertyId: string;
  propertyName: string;
  parentName: string;
  properties: PropertyDefinition[];
  operator?: string;
  value?: string | number | boolean;
  value2?: string | number;
  excluded?: boolean;
  disabled?: boolean;
  comment?: string;
  trackVariable?: string;
}

interface SectionConfig {
  id: string;
  title: string;
  rules: AddedRule[];
  matchType: MatchType;
  timePeriod: TimePeriod;
  isCollapsed: boolean;
}

function AudienceBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { schema, customers } = useApp();

  // Local state for audience being edited
  const [audienceName, setAudienceName] = useState('New Audience');
  const [audienceId, setAudienceId] = useState<string | undefined>(undefined);
  const [audienceStatus, setAudienceStatus] = useState<'unsaved' | 'draft' | 'published'>('unsaved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [recentlyUsed, setRecentlyUsed] = useState<PropertyReference[]>([]);
  const [activePane, setActivePane] = useState<ToolbarPane>('library');
  const [previewTimePeriod, setPreviewTimePeriod] = useState<PreviewTimePeriod>('last30days');
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);
  const [activatedSections, setActivatedSections] = useState<Set<string>>(new Set(['entry']));
  const [activeSectionId, setActiveSectionId] = useState<string>('entry');

  // View mode state
  const [viewMode, setViewMode] = useState<'edit' | 'view'>('edit');

  // Sync & activation state
  const [syncDestinations, setSyncDestinations] = useState<AddedDestination[]>([]);
  const [experimentMode, setExperimentMode] = useState(false);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<PropertyReference | AddedRule | null>(null);

  // Set up drag sensors (mouse only for now)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Load audience from localStorage if ID provided
  useEffect(() => {
    if (id && id !== 'new') {
      const saved = getAudience(id);
      if (saved) {
        setAudienceName(saved.name);
        setAudienceId(saved.id);
        setAudienceStatus(saved.status);
        setSections(saved.sections as SectionConfig[]);
        setHasUnsavedChanges(false);

        // Auto-switch to view mode if published
        if (saved.status === 'published') {
          setViewMode('view');
        }
      }
    }
  }, [id]);

  // Auto-focus entry section input on page load
  useEffect(() => {
    setFocusSectionId('entry');
    const timer = setTimeout(() => setFocusSectionId(null), 100);
    return () => clearTimeout(timer);
  }, []); // Empty deps - runs once on mount

  // Section state
  const [sections, setSections] = useState<SectionConfig[]>([
    {
      id: 'entry',
      title: 'Enter audience if',
      rules: [],
      matchType: 'all',
      timePeriod: 'last30days',
      isCollapsed: false,
    },
    {
      id: 'goals',
      title: 'Goals',
      rules: [],
      matchType: 'all',
      timePeriod: 'last30days',
      isCollapsed: false,
    },
    {
      id: 'sync',
      title: 'Sync and activation',
      rules: [],
      matchType: 'all',
      timePeriod: 'last30days',
      isCollapsed: false,
    },
    {
      id: 'exit',
      title: 'Exit audience if',
      rules: [],
      matchType: 'all',
      timePeriod: 'last30days',
      isCollapsed: false,
    },
  ]);

  // Handle clicking a property directly
  const handlePropertyClick = (propertyRef: PropertyReference) => {
    // Find the parent item
    const item = propertyRef.type === 'fact'
      ? schema?.facts.find(f => f.id === propertyRef.parentId)
      : schema?.engagements.find(e => e.id === propertyRef.parentId);

    if (!item) return;

    // Create rule with pre-selected property
    const newRule: AddedRule = {
      id: `${propertyRef.type}_${item.id}_${propertyRef.property.id}_${Date.now()}`,
      propertyId: propertyRef.property.id,
      propertyName: propertyRef.property.name,
      parentName: propertyRef.parentName,
      properties: item.properties,
    };

    // Add to active section
    setSections(prev => prev.map(section =>
      section.id === activeSectionId
        ? { ...section, rules: [...section.rules, newRule] }
        : section
    ));

    // Add to recently used (limit to 5 most recent, no duplicates)
    setRecentlyUsed(prev => {
      // Remove if already exists
      const filtered = prev.filter(p =>
        !(p.parentId === propertyRef.parentId && p.property.id === propertyRef.property.id)
      );
      // Add to beginning and limit to 5
      return [propertyRef, ...filtered].slice(0, 5);
    });
  };

  const handleSectionMatchTypeChange = (sectionId: string, matchType: MatchType) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, matchType }
        : section
    ));
    setHasUnsavedChanges(true);
  };

  const handleSectionTimePeriodChange = (sectionId: string, timePeriod: TimePeriod) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, timePeriod }
        : section
    ));
    setHasUnsavedChanges(true);
  };

  const handleSectionToggleCollapse = (sectionId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, isCollapsed: !section.isCollapsed }
        : section
    ));
  };

  const handleRuleDelete = (sectionId: string, ruleId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, rules: section.rules.filter(r => r.id !== ruleId) }
        : section
    ));
    setHasUnsavedChanges(true);
  };

  const handleRuleAdd = (sectionId: string, propertyId: string) => {
    console.log('Add rule to section:', sectionId, propertyId);
    // TODO: Implement rule addition from search
  };

  const handleRuleChange = (sectionId: string, ruleId: string, data: {
    property: string;
    operator: string;
    value: string | number | boolean;
  }) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            rules: section.rules.map(rule =>
              rule.id === ruleId
                ? { ...rule, operator: data.operator, value: data.value }
                : rule
            )
          }
        : section
    ));
    setHasUnsavedChanges(true);
  };

  const handleRuleToggleExcluded = (sectionId: string, ruleId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            rules: section.rules.map(rule =>
              rule.id === ruleId
                ? { ...rule, excluded: !rule.excluded }
                : rule
            )
          }
        : section
    ));
  };

  const handleRuleToggleDisabled = (sectionId: string, ruleId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            rules: section.rules.map(rule =>
              rule.id === ruleId
                ? { ...rule, disabled: !rule.disabled }
                : rule
            )
          }
        : section
    ));
  };

  const handleRuleCommentChange = (sectionId: string, ruleId: string, comment: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            rules: section.rules.map(rule =>
              rule.id === ruleId
                ? { ...rule, comment: comment || undefined }
                : rule
            )
          }
        : section
    ));
  };

  const handleRuleTrackVariableChange = (sectionId: string, ruleId: string, variable: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            rules: section.rules.map(rule =>
              rule.id === ruleId
                ? { ...rule, trackVariable: variable || undefined }
                : rule
            )
          }
        : section
    ));
  };

  const handleAddPropertyToSection = (sectionId: string, match: PropertyMatch) => {
    // Find the parent item to get all properties
    const parentItem = match.type === 'fact'
      ? schema?.facts.find(f => f.id === match.parentId)
      : schema?.engagements.find(e => e.id === match.parentId);

    if (!parentItem) return;

    // Create a new rule with the selected property
    const newRule: AddedRule = {
      id: `rule-${Date.now()}`,
      propertyId: match.property.id,
      propertyName: match.property.name,
      parentName: match.parentName,
      properties: parentItem.properties,
    };

    // Add to the specified section
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, rules: [...section.rules, newRule] }
        : section
    ));

    setHasUnsavedChanges(true);

    // Add to recently used
    const propertyRef: PropertyReference = {
      type: match.type,
      parentId: match.parentId,
      parentName: match.parentName,
      property: match.property,
    };

    setRecentlyUsed(prev => {
      const filtered = prev.filter(p =>
        !(p.parentId === propertyRef.parentId && p.property.id === propertyRef.property.id)
      );
      return [propertyRef, ...filtered].slice(0, 5);
    });
  };

  const handleAddAISuggestionsToSection = (sectionId: string, suggestions: AISuggestion[]) => {
    // Convert AI suggestions to rules
    const newRules: AddedRule[] = suggestions.map(suggestion => ({
      id: suggestion.id,
      propertyId: suggestion.propertyId,
      propertyName: suggestion.propertyName,
      parentName: suggestion.parentName,
      properties: suggestion.properties,
    }));

    // Add all rules to the specified section
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, rules: [...section.rules, ...newRules] }
        : section
    ));

    console.log('Added AI suggestions to section:', sectionId, newRules);
  };

  const handleAddSection = (sectionId: string) => {
    // Mark section as activated so it shows even with 0 rules
    setActivatedSections(prev => new Set([...prev, sectionId]));

    // Set as active section
    setActiveSectionId(sectionId);

    // Focus the search input so user can immediately start typing
    setFocusSectionId(sectionId);

    // Clear the focus flag after a short delay to allow re-focusing if needed
    setTimeout(() => setFocusSectionId(null), 100);
  };

  const handleSetActiveSection = (sectionId: string) => {
    // Auto-collapse current active section if it has no rules
    const currentActiveSection = sections.find(s => s.id === activeSectionId);
    if (currentActiveSection && currentActiveSection.rules.length === 0 && currentActiveSection.id !== 'entry') {
      // Remove from activated sections (make it ghost again)
      setActivatedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(activeSectionId);
        return newSet;
      });
    }

    setActiveSectionId(sectionId);
  };

  const handleSave = () => {
    const saved = saveAudience({
      id: audienceId,
      name: audienceName,
      sections,
      status: 'draft',
    });
    setAudienceId(saved.id);
    setAudienceStatus('draft');
    setHasUnsavedChanges(false);
    // Stay in builder after save (now a draft)
  };

  const handlePublish = () => {
    const saved = saveAudience({
      id: audienceId,
      name: audienceName,
      sections,
      status: 'published',
    });
    setAudienceId(saved.id);
    setAudienceStatus('published');
    setHasUnsavedChanges(false);
    // Switch to view mode after publish
    setViewMode('view');
  };

  const handleEdit = () => {
    // Enable edit mode for published audience
    setViewMode('edit');
  };

  const handleAnalyzeAudience = () => {
    setViewMode('view');
  };

  // Destination handlers
  const handleSelectDestination = (destination: Destination) => {
    // Convert to AddedDestination with default percentage for experiment mode
    const addedDestination: AddedDestination = {
      ...destination,
      trafficPercentage: experimentMode ? 0 : undefined,
    };

    setSyncDestinations(prev => [...prev, addedDestination]);

    // Auto-distribute percentages if in experiment mode
    if (experimentMode) {
      const newCount = syncDestinations.length + 1;
      const equalPercentage = Math.floor(100 / newCount);
      const remainder = 100 - (equalPercentage * newCount);

      setSyncDestinations(prev => prev.map((dest, index) => ({
        ...dest,
        trafficPercentage: index === 0 ? equalPercentage + remainder : equalPercentage,
      })));
    }
  };

  const handleDestinationDelete = (destinationId: string) => {
    setSyncDestinations(prev => prev.filter(d => d.id !== destinationId));

    // Re-distribute percentages if in experiment mode
    if (experimentMode) {
      const remaining = syncDestinations.filter(d => d.id !== destinationId);
      if (remaining.length > 0) {
        const equalPercentage = Math.floor(100 / remaining.length);
        const remainder = 100 - (equalPercentage * remaining.length);

        setSyncDestinations(remaining.map((dest, index) => ({
          ...dest,
          trafficPercentage: index === 0 ? equalPercentage + remainder : equalPercentage,
        })));
      }
    }
  };

  const handleDestinationTogglePaused = (destinationId: string) => {
    setSyncDestinations(prev => prev.map(dest =>
      dest.id === destinationId
        ? { ...dest, disabled: !dest.disabled }
        : dest
    ));
  };

  const handleDestinationCommentChange = (destinationId: string, comment: string) => {
    setSyncDestinations(prev => prev.map(dest =>
      dest.id === destinationId
        ? { ...dest, comment: comment || undefined }
        : dest
    ));
  };

  const handleDestinationPercentageChange = (destinationId: string, percentage: number, autoAdjust: boolean = false) => {
    setSyncDestinations(prev => {
      // Clamp percentage to 0-100
      const newPercentage = Math.max(0, Math.min(100, percentage));

      // If not auto-adjusting (manual input), just update the target destination
      if (!autoAdjust) {
        return prev.map(dest =>
          dest.id === destinationId
            ? { ...dest, trafficPercentage: newPercentage }
            : dest
        );
      }

      // Auto-adjust mode (from slider): proportionally redistribute

      // Find the destination being changed and its current percentage
      const targetDest = prev.find(d => d.id === destinationId);
      if (!targetDest) return prev;

      const oldPercentage = targetDest.trafficPercentage || 0;
      const diff = newPercentage - oldPercentage;

      // If no change, return as-is
      if (diff === 0) return prev;

      // Get all other destinations
      const others = prev.filter(d => d.id !== destinationId);

      // If there are no other destinations, just set it to 100
      if (others.length === 0) {
        return prev.map(dest =>
          dest.id === destinationId
            ? { ...dest, trafficPercentage: 100 }
            : dest
        );
      }

      // Calculate total of other destinations
      const othersTotal = others.reduce((sum, d) => sum + (d.trafficPercentage || 0), 0);

      // Calculate how much we need to distribute/take from others
      const amountToDistribute = -diff; // negative if we're increasing target, positive if decreasing

      // Distribute proportionally among others
      let distributed = 0;
      const newDestinations = prev.map((dest, index) => {
        if (dest.id === destinationId) {
          return { ...dest, trafficPercentage: newPercentage };
        }

        // Calculate this destination's share of the distribution
        const currentPercentage = dest.trafficPercentage || 0;
        const proportion = othersTotal > 0 ? currentPercentage / othersTotal : 1 / others.length;

        // Calculate new percentage (proportional distribution)
        let newDestPercentage = currentPercentage + (amountToDistribute * proportion);

        // For the last destination, adjust to ensure total = 100 (handle rounding)
        const isLastOther = index === prev.length - 1 && dest.id !== destinationId;
        if (isLastOther) {
          const currentTotal = newPercentage + distributed;
          newDestPercentage = 100 - currentTotal;
        } else {
          distributed += newDestPercentage;
        }

        // Clamp to 0-100
        newDestPercentage = Math.max(0, Math.min(100, Math.round(newDestPercentage)));

        return { ...dest, trafficPercentage: newDestPercentage };
      });

      return newDestinations;
    });
  };

  const handleDestinationTargetAudienceChange = (destinationId: string, audienceName: string) => {
    setSyncDestinations(prev => prev.map(dest =>
      dest.id === destinationId
        ? { ...dest, targetAudienceName: audienceName }
        : dest
    ));
  };

  const handleSplitEqually = () => {
    if (syncDestinations.length === 0) return;

    const equalPercentage = Math.floor(100 / syncDestinations.length);
    const remainder = 100 - (equalPercentage * syncDestinations.length);

    setSyncDestinations(prev => prev.map((dest, index) => ({
      ...dest,
      trafficPercentage: index === 0 ? equalPercentage + remainder : equalPercentage,
    })));
  };

  const handleExperimentToggle = () => {
    const newExperimentMode = !experimentMode;
    setExperimentMode(newExperimentMode);

    if (newExperimentMode && syncDestinations.length > 0) {
      handleSplitEqually();
    } else if (!newExperimentMode) {
      // Clear percentages
      setSyncDestinations(prev => prev.map(dest => ({
        ...dest,
        trafficPercentage: undefined,
      })));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Store the dragged item data for the overlay
    if (active.data.current) {
      setActiveDragItem(active.data.current as PropertyReference | AddedRule);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveDragItem(null);

    if (!over) return;

    // Handle different drag scenarios
    const activeData = active.data.current;
    const overData = over.data.current;

    // Scenario 1: Dragging a property from library to a section
    if (activeData?.dragType === 'property' && overData?.type === 'section') {
      const propertyRef = activeData as PropertyReference;
      const sectionId = over.id as string;

      // Find the parent item to get all properties for the dropdown
      const parentItem = propertyRef.type === 'fact'
        ? schema?.facts.find(f => f.id === propertyRef.parentId)
        : schema?.engagements.find(e => e.id === propertyRef.parentId);

      if (!parentItem) return;

      // Create a minimal rule with just the property selected, but include all parent properties
      const newRule: AddedRule = {
        id: `rule-${Date.now()}`,
        propertyId: propertyRef.property.id,
        propertyName: propertyRef.property.name,
        parentName: propertyRef.parentName,
        properties: parentItem.properties, // Include all properties for dropdown
      };

      setSections(prevSections =>
        prevSections.map(section =>
          section.id === sectionId
            ? { ...section, rules: [...section.rules, newRule] }
            : section
        )
      );

      console.log('Created rule from library drag:', newRule, 'in section:', sectionId);
    }

    // Scenario 1b: Dragging a property from library over a rule (middle area)
    if (activeData?.dragType === 'property' && overData?.dragType === 'rule') {
      const propertyRef = activeData as PropertyReference;
      const overRuleId = over.id as string;

      // Find which section contains the rule we're hovering over
      const sectionWithRule = sections.find(section =>
        section.rules.some(rule => rule.id === overRuleId)
      );

      if (!sectionWithRule) return;

      // Find the parent item to get all properties for the dropdown
      const parentItem = propertyRef.type === 'fact'
        ? schema?.facts.find(f => f.id === propertyRef.parentId)
        : schema?.engagements.find(e => e.id === propertyRef.parentId);

      if (!parentItem) return;

      // Create a new rule
      const newRule: AddedRule = {
        id: `rule-${Date.now()}`,
        propertyId: propertyRef.property.id,
        propertyName: propertyRef.property.name,
        parentName: propertyRef.parentName,
        properties: parentItem.properties,
      };

      setSections(prevSections =>
        prevSections.map(section =>
          section.id === sectionWithRule.id
            ? { ...section, rules: [...section.rules, newRule] }
            : section
        )
      );

      console.log('Created rule from library drag over rule:', newRule, 'in section:', sectionWithRule.id);
    }

    // Scenario 2: Reordering rules within the same section
    if (activeData?.dragType === 'rule' && overData?.dragType === 'rule') {
      const activeRuleId = active.id as string;
      const overRuleId = over.id as string;

      if (activeRuleId === overRuleId) return;

      // Find which section contains these rules
      setSections(prevSections => {
        // Find the section containing the active rule
        const sectionWithRule = prevSections.find(section =>
          section.rules.some(rule => rule.id === activeRuleId)
        );

        if (!sectionWithRule) return prevSections;

        return prevSections.map(section => {
          if (section.id !== sectionWithRule.id) return section;

          const oldIndex = section.rules.findIndex(rule => rule.id === activeRuleId);
          const newIndex = section.rules.findIndex(rule => rule.id === overRuleId);

          return {
            ...section,
            rules: arrayMove(section.rules, oldIndex, newIndex),
          };
        });
      });

      console.log('Reordered rule:', activeRuleId, 'to position of:', overRuleId);
    }

    // Scenario 3: Moving a rule to a different section
    if (activeData?.dragType === 'rule' && overData?.type === 'section') {
      const ruleId = active.id as string;
      const targetSectionId = over.id as string;

      setSections(prevSections => {
        // Find the rule and its current section
        let ruleToMove: AddedRule | undefined;
        let sourceSectionId: string | undefined;

        for (const section of prevSections) {
          const rule = section.rules.find(r => r.id === ruleId);
          if (rule) {
            ruleToMove = rule;
            sourceSectionId = section.id;
            break;
          }
        }

        if (!ruleToMove || !sourceSectionId || sourceSectionId === targetSectionId) {
          return prevSections;
        }

        // Remove from source section and add to target section
        return prevSections.map(section => {
          if (section.id === sourceSectionId) {
            return {
              ...section,
              rules: section.rules.filter(r => r.id !== ruleId),
            };
          } else if (section.id === targetSectionId) {
            return {
              ...section,
              rules: [...section.rules, ruleToMove],
            };
          }
          return section;
        });
      });

      console.log('Moved rule:', ruleId, 'to section:', targetSectionId);
    }

    // Scenario 4: Dragging a property from library to a ghost section (create section + add rule)
    if (activeData?.dragType === 'property' && overData?.type === 'ghost-section') {
      const propertyRef = activeData as PropertyReference;
      const sectionId = over.id as string;

      // Find the parent item to get all properties for the dropdown
      const parentItem = propertyRef.type === 'fact'
        ? schema?.facts.find(f => f.id === propertyRef.parentId)
        : schema?.engagements.find(e => e.id === propertyRef.parentId);

      if (!parentItem) return;

      // Create a minimal rule with the property selected
      const newRule: AddedRule = {
        id: `rule-${Date.now()}`,
        propertyId: propertyRef.property.id,
        propertyName: propertyRef.property.name,
        parentName: propertyRef.parentName,
        properties: parentItem.properties,
      };

      // Add rule to the ghost section (which activates it)
      setSections(prevSections =>
        prevSections.map(section =>
          section.id === sectionId
            ? { ...section, rules: [newRule] }
            : section
        )
      );

      console.log('Created section and rule from library drag:', newRule, 'in section:', sectionId);
    }

    // Scenario 5: Moving a rule to a ghost section (create section + move rule)
    if (activeData?.dragType === 'rule' && overData?.type === 'ghost-section') {
      const ruleId = active.id as string;
      const targetSectionId = over.id as string;

      setSections(prevSections => {
        // Find the rule and its current section
        let ruleToMove: AddedRule | undefined;
        let sourceSectionId: string | undefined;

        for (const section of prevSections) {
          const rule = section.rules.find(r => r.id === ruleId);
          if (rule) {
            ruleToMove = rule;
            sourceSectionId = section.id;
            break;
          }
        }

        if (!ruleToMove || !sourceSectionId) {
          return prevSections;
        }

        // Remove from source section and add to ghost section (activating it)
        return prevSections.map(section => {
          if (section.id === sourceSectionId) {
            return {
              ...section,
              rules: section.rules.filter(r => r.id !== ruleId),
            };
          } else if (section.id === targetSectionId) {
            return {
              ...section,
              rules: [ruleToMove], // Ghost section starts with this rule
            };
          }
          return section;
        });
      });

      console.log('Created section and moved rule:', ruleId, 'to section:', targetSectionId);
    }
  };

  if (!schema) {
    return (
      <Box p={6}>
        <p>Loading schema...</p>
      </Box>
    );
  }

  // Calculate matching profiles using query engine
  const matchingProfiles = useMemo(() => {
    if (!schema) return 0;

    try {
      // Convert sections to query conditions
      const conditions = sectionsToConditionGroup(sections, schema);

      // Calculate using query engine
      return calculateAudienceSize(customers, conditions);
    } catch (error) {
      console.error('Error calculating audience size:', error);
      return 0; // Fallback to 0 on error
    }
  }, [sections, customers, schema]);

  const reachedGoals = 0; // TODO: Calculate based on goals section

  // Check if we have any COMPLETE rules (property + operator + value)
  const hasCompleteRule = sections.some(section =>
    section.rules.some(rule => {
      if (!rule.operator) return false;

      // Some operators don't need values (isTrue, isFalse, time-based)
      const operatorsWithoutValue = ['isTrue', 'isFalse', 'last7days', 'last30days', 'last90days'];
      if (operatorsWithoutValue.includes(rule.operator)) return true;

      // Other operators need a value
      return rule.value !== undefined && rule.value !== '';
    })
  );

  // Custom drop animation for better visual feedback
  const dropAnimation: DropAnimation = {
    duration: 200,
    easing: 'ease-out',
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box bg="#fbfbfb" height="100vh" overflow="hidden">
        {/* Fixed Header */}
        <EditorHeader
          audienceName={audienceName}
          status={audienceStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          isViewMode={viewMode === 'view'}
          hasCompleteRule={hasCompleteRule}
          onNameChange={setAudienceName}
          onSave={handleSave}
          onPublish={handlePublish}
          onAnalyze={handleAnalyzeAudience}
          onEdit={handleEdit}
          lastModified="Just now"
        />

        {/* Main Layout: Conditional based on view mode */}
        <Flex
          pt="60px"
          height="100vh"
        >
          {viewMode === 'edit' ? (
            <>
              {/* EDIT MODE LAYOUT */}

              {/* Toolbar - Hidden for now, keep code for potential future use */}
              {/* <Toolbar
                activePane={activePane}
                onPaneChange={setActivePane}
              /> */}

              {/* Library Pane - conditionally rendered */}
              {activePane === 'library' && (
                <Box pt={2} px={6} pb={6} display="flex" alignItems="flex-start">
                  <LibraryPane
                    facts={schema.facts}
                    engagements={schema.engagements}
                    recentlyUsed={recentlyUsed}
                    isVisible={true}
                    onItemClick={() => {}} // Deprecated
                    onPropertyClick={handlePropertyClick}
                    onClose={() => setActivePane(null)}
                  />
                </Box>
              )}

              {/* Main Content Area - Canvas */}
              <Box flex="1" display="flex" justifyContent="center" pt={2} px={6} pb={6} overflowY="auto">
                <Canvas
                  sections={sections}
                  facts={schema.facts}
                  engagements={schema.engagements}
                  focusSectionId={focusSectionId}
                  activatedSections={activatedSections}
                  activeSectionId={activeSectionId}
                  syncDestinations={syncDestinations}
                  experimentMode={experimentMode}
                  isDestinationModalOpen={isDestinationModalOpen}
                  onSectionMatchTypeChange={handleSectionMatchTypeChange}
                  onSectionTimePeriodChange={handleSectionTimePeriodChange}
                  onSectionToggleCollapse={handleSectionToggleCollapse}
                  onRuleDelete={handleRuleDelete}
                  onRuleAdd={handleRuleAdd}
                  onRuleChange={handleRuleChange}
                  onRuleToggleExcluded={handleRuleToggleExcluded}
                  onRuleToggleDisabled={handleRuleToggleDisabled}
                  onRuleCommentChange={handleRuleCommentChange}
                  onRuleTrackVariableChange={handleRuleTrackVariableChange}
                  onAddSection={handleAddSection}
                  onSetActiveSection={handleSetActiveSection}
                  onAddProperty={handleAddPropertyToSection}
                  onAddAISuggestions={handleAddAISuggestionsToSection}
                  onOpenDestinationModal={() => setIsDestinationModalOpen(true)}
                  onCloseDestinationModal={() => setIsDestinationModalOpen(false)}
                  onSelectDestination={handleSelectDestination}
                  onDestinationDelete={handleDestinationDelete}
                  onDestinationTogglePaused={handleDestinationTogglePaused}
                  onDestinationCommentChange={handleDestinationCommentChange}
                  onDestinationPercentageChange={handleDestinationPercentageChange}
                  onDestinationTargetAudienceChange={handleDestinationTargetAudienceChange}
                  onExperimentToggle={handleExperimentToggle}
                  onSplitEqually={handleSplitEqually}
                />
              </Box>

              {/* Preview Pane - visible when at least one rule is fully configured */}
              {hasCompleteRule && (
                <Box pt={2} px={6} pb={6} display="flex" alignItems="flex-start">
                  <PreviewPane
                    matchingProfiles={matchingProfiles}
                    reachedGoals={reachedGoals}
                    timePeriod={previewTimePeriod}
                    onTimePeriodChange={setPreviewTimePeriod}
                    hasGoals={(sections.find(s => s.id === 'goals')?.rules.length ?? 0) > 0}
                    hasExitConditions={(sections.find(s => s.id === 'exit')?.rules.length ?? 0) > 0}
                  />
                </Box>
              )}
            </>
          ) : (
            <>
              {/* VIEW MODE LAYOUT */}

              {/* Left: Dashboard */}
              <Box flex="1" display="flex" justifyContent="center" pt={2} px={6} pb={6} overflowY="auto">
                <Dashboard
                  matchingProfiles={matchingProfiles}
                  sections={sections}
                  customers={customers}
                />
              </Box>

              {/* Right: Audience Summary Panel */}
              <Box pt={2} px={6} pb={6} display="flex" alignItems="flex-start">
                <AudienceSummary
                  sections={sections}
                  syncDestinations={syncDestinations}
                  experimentMode={experimentMode}
                />
              </Box>
            </>
          )}
        </Flex>

        {/* Drag Overlay - shows dragged item */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeId && activeDragItem ? (
            <Box
              px={3}
              py={2}
              bg="blue.500"
              color="white"
              borderRadius="md"
              opacity={0.9}
              fontSize="sm"
            >
              {('property' in activeDragItem) ? activeDragItem.property.name : activeDragItem.propertyName}
            </Box>
          ) : null}
        </DragOverlay>
      </Box>
    </DndContext>
  );
}

export default AudienceBuilderPage;
