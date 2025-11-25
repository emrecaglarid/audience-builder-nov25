import { useParams } from 'react-router-dom';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
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
import { PropertyReference } from '@/types';
import EditorHeader from './EditorHeader';
import LibraryPane from './LibraryPane';
import { Canvas } from './Canvas';
import PreviewPane, { PreviewTimePeriod } from './PreviewPane';
import { ToolbarPane } from './Toolbar';
import { MatchType, TimePeriod, type AddedRule, type RuleGroup, isRuleGroup } from './CriteriaSection';
import type { PropertyMatch } from './PropertyDropdown';
import type { AISuggestion } from './aiSuggestions';
import { calculateAudienceSize } from '@/utils/queryEngine';
import { sectionsToConditionGroup } from '@/utils/audienceQueryBuilder';
import type { AddedDestination, Destination } from '../../types/destination';
import { AudienceSummary } from './ViewMode/AudienceSummary';
import { Dashboard } from './ViewMode/Dashboard';
import { HistoricalDataModal } from './ViewMode/HistoricalDataModal';

interface SectionConfig {
  id: string;
  title: string;
  items: (AddedRule | RuleGroup)[];
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
  const [audienceStatus, setAudienceStatus] = useState<'draft' | 'published'>('draft');
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

  // Historical data state
  const [hasHistoricalData, setHasHistoricalData] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isHistoricalDataModalOpen, setIsHistoricalDataModalOpen] = useState(false);

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<PropertyReference | AddedRule | RuleGroup | null>(null);

  // Preview calculation state
  const [isCalculating, setIsCalculating] = useState(false);

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

        // Load sync destinations and experiment mode
        if (saved.syncDestinations) {
          setSyncDestinations(saved.syncDestinations);
        }
        if (saved.experimentMode !== undefined) {
          setExperimentMode(saved.experimentMode);
        }

        // Load historical data state
        if (saved.hasHistoricalData !== undefined) {
          setHasHistoricalData(saved.hasHistoricalData);
        }

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
      items: [],
      matchType: 'all',
      timePeriod: 'last30days',
      isCollapsed: false,
    },
    {
      id: 'goals',
      title: 'Goals',
      items: [],
      matchType: 'all',
      timePeriod: 'last30days',
      isCollapsed: false,
    },
    {
      id: 'sync',
      title: 'Sync and activation',
      items: [],
      matchType: 'all',
      timePeriod: 'last30days',
      isCollapsed: false,
    },
    {
      id: 'exit',
      title: 'Exit audience if',
      items: [],
      matchType: 'all',
      timePeriod: 'last30days',
      isCollapsed: false,
    },
  ]);

  // Auto-cleanup invalid groups (groups with < 2 rules)
  useEffect(() => {
    setSections(prevSections => {
      let hasChanges = false;
      const newSections = prevSections.map(section => {
        const newItems: (AddedRule | RuleGroup)[] = [];

        for (const item of section.items) {
          if (isRuleGroup(item)) {
            // If group has < 2 rules, ungroup it
            if (item.rules.length < 2) {
              hasChanges = true;
              newItems.push(...item.rules); // Add rules directly
            } else {
              newItems.push(item); // Keep the group
            }
          } else {
            newItems.push(item);
          }
        }

        return hasChanges ? { ...section, items: newItems } : section;
      });

      return hasChanges ? newSections : prevSections;
    });
  }, [sections]); // Run whenever sections change

  // Selection state for grouping
  const [sectionSelectionMode, setSectionSelectionMode] = useState<Record<string, boolean>>({});
  const [sectionSelectedRules, setSectionSelectedRules] = useState<Record<string, Set<string>>>({});

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
        ? { ...section, items: [...section.items, newRule] }
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
        ? { ...section, items: section.items.filter(r => !isRuleGroup(r) && r.id !== ruleId) }
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
            items: section.items.map(item =>
              !isRuleGroup(item) && item.id === ruleId
                ? { ...item, operator: data.operator, value: data.value }
                : item
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
            items: section.items.map(item =>
              !isRuleGroup(item) && item.id === ruleId
                ? { ...item, excluded: !item.excluded }
                : item
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
            items: section.items.map(item =>
              !isRuleGroup(item) && item.id === ruleId
                ? { ...item, disabled: !item.disabled }
                : item
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
            items: section.items.map(item =>
              !isRuleGroup(item) && item.id === ruleId
                ? { ...item, comment: comment || undefined }
                : item
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
            items: section.items.map(item =>
              !isRuleGroup(item) && item.id === ruleId
                ? { ...item, trackVariable: variable || undefined }
                : item
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
        ? { ...section, items: [...section.items, newRule] }
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
        ? { ...section, items: [...section.items, ...newRules] }
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
    setActiveSectionId(sectionId);
  };

  // Selection handlers for grouping
  const handleEnterSelectionMode = (sectionId: string) => {
    setSectionSelectionMode(prev => ({ ...prev, [sectionId]: true }));
    setSectionSelectedRules(prev => ({ ...prev, [sectionId]: new Set() }));
  };

  const handleExitSelectionMode = (sectionId: string) => {
    setSectionSelectionMode(prev => ({ ...prev, [sectionId]: false }));
    setSectionSelectedRules(prev => ({ ...prev, [sectionId]: new Set() }));
  };

  const handleToggleRuleSelection = (sectionId: string, ruleId: string) => {
    setSectionSelectedRules(prev => {
      const sectionSet = new Set(prev[sectionId] || []);
      if (sectionSet.has(ruleId)) {
        sectionSet.delete(ruleId);
      } else {
        sectionSet.add(ruleId);
      }
      return { ...prev, [sectionId]: sectionSet };
    });
  };

  const handleGroupSelected = (sectionId: string) => {
    const selectedIds = sectionSelectedRules[sectionId];
    if (!selectedIds || selectedIds.size < 2) return;

    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      // Extract selected rules (only AddedRule items, not groups)
      const selectedRules = section.items.filter(
        item => !isRuleGroup(item) && selectedIds.has(item.id)
      ) as AddedRule[];

      // Remove selected rules from items
      const remainingItems = section.items.filter(
        item => isRuleGroup(item) || !selectedIds.has(item.id)
      );

      // Count existing groups to name the new one
      const existingGroupCount = section.items.filter(isRuleGroup).length;

      // Create new group
      const newGroup: RuleGroup = {
        id: `group-${Date.now()}`,
        type: 'group',
        matchType: 'all',
        rules: selectedRules,
        name: `Group ${existingGroupCount + 1}`,
      };

      // Find index where first selected rule was
      const insertIndex = section.items.findIndex(
        item => !isRuleGroup(item) && selectedIds.has(item.id)
      );

      // Insert group at that position
      const newItems = [...remainingItems];
      newItems.splice(insertIndex >= 0 ? insertIndex : newItems.length, 0, newGroup);

      return { ...section, items: newItems };
    }));

    // Exit selection mode
    handleExitSelectionMode(sectionId);
    setHasUnsavedChanges(true);
  };

  const handleUngroupGroup = (sectionId: string, groupId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      const newItems: (AddedRule | RuleGroup)[] = [];
      section.items.forEach(item => {
        if (isRuleGroup(item) && item.id === groupId) {
          // Replace group with its rules
          newItems.push(...item.rules);
        } else {
          newItems.push(item);
        }
      });

      return { ...section, items: newItems };
    }));

    setHasUnsavedChanges(true);
  };

  const handleGroupMatchTypeChange = (sectionId: string, groupId: string, matchType: MatchType) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      return {
        ...section,
        items: section.items.map(item => {
          if (isRuleGroup(item) && item.id === groupId) {
            return { ...item, matchType };
          }
          return item;
        }),
      };
    }));

    setHasUnsavedChanges(true);
  };

  const handleRenameGroup = (sectionId: string, groupId: string, name: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      return {
        ...section,
        items: section.items.map(item => {
          if (isRuleGroup(item) && item.id === groupId) {
            return { ...item, name: name || undefined };
          }
          return item;
        }),
      };
    }));

    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    const saved = saveAudience({
      id: audienceId,
      name: audienceName,
      sections,
      status: 'draft',
      syncDestinations,
      experimentMode,
      hasHistoricalData,
    });
    setAudienceId(saved.id);
    setAudienceStatus('draft');
    setHasUnsavedChanges(false);
    // Stay in builder after save (now a draft)
  };

  const handlePublish = () => {
    // Reset historical data on first publish (draft → published)
    // Keep existing historical data if re-publishing (published → published with edits)
    const isFirstPublish = audienceStatus !== 'published';

    const saved = saveAudience({
      id: audienceId,
      name: audienceName,
      sections,
      status: 'published',
      syncDestinations,
      experimentMode,
      hasHistoricalData: isFirstPublish ? false : hasHistoricalData,
    });
    setAudienceId(saved.id);
    setAudienceStatus('published');
    setHasUnsavedChanges(false);
    // Reset local state if first publish
    if (isFirstPublish) {
      setHasHistoricalData(false);
    }
    // Switch to view mode after publish
    setViewMode('view');
  };

  const handleEdit = () => {
    // Enable edit mode for published audience
    setViewMode('edit');
  };

  const handleUnpublish = () => {
    // Unpublish audience: change to draft and reset historical data
    const saved = saveAudience({
      id: audienceId,
      name: audienceName,
      sections,
      status: 'draft',
      syncDestinations,
      experimentMode,
      hasHistoricalData: false,
    });
    setAudienceId(saved.id);
    setAudienceStatus('draft');
    setHasHistoricalData(false);
    setHasUnsavedChanges(false);
    // Switch back to edit mode
    setViewMode('edit');
  };

  const handleAnalyzeAudience = () => {
    setViewMode('view');
  };

  // Historical data handlers
  const handleOpenHistoricalDataModal = () => {
    setIsHistoricalDataModalOpen(true);
  };

  const handleLoadHistoricalData = async () => {
    // Close modal
    setIsHistoricalDataModalOpen(false);

    // Start loading
    setIsLoadingData(true);
    setLoadingProgress(0);

    // Simulate loading with progress updates
    const duration = 10000 + Math.random() * 5000; // 10-15 seconds
    const interval = 100; // Update every 100ms
    const steps = duration / interval;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const progress = Math.min((currentStep / steps) * 100, 100);
      setLoadingProgress(progress);

      if (progress >= 100) {
        clearInterval(progressInterval);
        // Complete loading
        setIsLoadingData(false);
        setHasHistoricalData(true);
        setShowSuccessBanner(true);

        // Auto-dismiss success banner after 5 seconds
        setTimeout(() => setShowSuccessBanner(false), 5000);

        // Save to storage
        saveAudience({
          id: audienceId,
          name: audienceName,
          sections,
          status: audienceStatus,
          syncDestinations,
          experimentMode,
          hasHistoricalData: true,
          historicalDataLoadedAt: new Date().toISOString(),
        });
      }
    }, interval);
  };

  const handleCancelLoading = () => {
    // Cancel loading
    setIsLoadingData(false);
    setLoadingProgress(0);
  };

  const handleDismissSuccess = () => {
    setShowSuccessBanner(false);
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
      setActiveDragItem(active.data.current as PropertyReference | AddedRule | RuleGroup);
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
            ? { ...section, items: [...section.items, newRule] }
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
        section.items.some(item => !isRuleGroup(item) && item.id === overRuleId)
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
            ? { ...section, items: [...section.items, newRule] }
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
          section.items.some(item => !isRuleGroup(item) && item.id === activeRuleId)
        );

        if (!sectionWithRule) return prevSections;

        return prevSections.map(section => {
          if (section.id !== sectionWithRule.id) return section;

          const oldIndex = section.items.findIndex(item => !isRuleGroup(item) && item.id === activeRuleId);
          const newIndex = section.items.findIndex(item => !isRuleGroup(item) && item.id === overRuleId);

          return {
            ...section,
            items: arrayMove(section.items, oldIndex, newIndex),
          };
        });
      });

      console.log('Reordered rule:', activeRuleId, 'to position of:', overRuleId);
    }

    // Scenario 2b: Reordering groups within the same section
    if (activeData?.dragType === 'group' && overData?.dragType === 'group') {
      const activeGroupId = active.id as string;
      const overGroupId = over.id as string;

      if (activeGroupId === overGroupId) return;

      // Find which section contains these groups
      setSections(prevSections => {
        // Find the section containing the active group
        const sectionWithGroup = prevSections.find(section =>
          section.items.some(item => isRuleGroup(item) && item.id === activeGroupId)
        );

        if (!sectionWithGroup) return prevSections;

        return prevSections.map(section => {
          if (section.id !== sectionWithGroup.id) return section;

          const oldIndex = section.items.findIndex(item => isRuleGroup(item) && item.id === activeGroupId);
          const newIndex = section.items.findIndex(item => isRuleGroup(item) && item.id === overGroupId);

          return {
            ...section,
            items: arrayMove(section.items, oldIndex, newIndex),
          };
        });
      });

      console.log('Reordered group:', activeGroupId, 'to position of:', overGroupId);
    }

    // Scenario 2c: Dragging a rule over a group (reorder within section)
    if (activeData?.dragType === 'rule' && overData?.dragType === 'group') {
      const activeRuleId = active.id as string;
      const overGroupId = over.id as string;

      // Find which section contains these items
      setSections(prevSections => {
        // Find the section containing the active rule
        const sectionWithRule = prevSections.find(section =>
          section.items.some(item => !isRuleGroup(item) && item.id === activeRuleId)
        );

        if (!sectionWithRule) return prevSections;

        return prevSections.map(section => {
          if (section.id !== sectionWithRule.id) return section;

          const oldIndex = section.items.findIndex(item => !isRuleGroup(item) && item.id === activeRuleId);
          const newIndex = section.items.findIndex(item => isRuleGroup(item) && item.id === overGroupId);

          return {
            ...section,
            items: arrayMove(section.items, oldIndex, newIndex),
          };
        });
      });

      console.log('Reordered rule:', activeRuleId, 'near group:', overGroupId);
    }

    // Scenario 2d: Dragging a group over a rule (reorder within section)
    if (activeData?.dragType === 'group' && overData?.dragType === 'rule') {
      const activeGroupId = active.id as string;
      const overRuleId = over.id as string;

      // Find which section contains these items
      setSections(prevSections => {
        // Find the section containing the active group
        const sectionWithGroup = prevSections.find(section =>
          section.items.some(item => isRuleGroup(item) && item.id === activeGroupId)
        );

        if (!sectionWithGroup) return prevSections;

        return prevSections.map(section => {
          if (section.id !== sectionWithGroup.id) return section;

          const oldIndex = section.items.findIndex(item => isRuleGroup(item) && item.id === activeGroupId);
          const newIndex = section.items.findIndex(item => !isRuleGroup(item) && item.id === overRuleId);

          return {
            ...section,
            items: arrayMove(section.items, oldIndex, newIndex),
          };
        });
      });

      console.log('Reordered group:', activeGroupId, 'near rule:', overRuleId);
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
          const item = section.items.find(i => !isRuleGroup(i) && i.id === ruleId);
          if (item && !isRuleGroup(item)) {
            ruleToMove = item;
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
              items: section.items.filter(i => !((!isRuleGroup(i)) && i.id === ruleId)),
            };
          } else if (section.id === targetSectionId) {
            return {
              ...section,
              items: [...section.items, ruleToMove],
            };
          }
          return section;
        });
      });

      console.log('Moved rule:', ruleId, 'to section:', targetSectionId);
    }

    // Scenario 3b: Moving a group to a different section
    if (activeData?.dragType === 'group' && overData?.type === 'section') {
      const groupId = active.id as string;
      const targetSectionId = over.id as string;

      setSections(prevSections => {
        // Find the group and its current section
        let groupToMove: RuleGroup | undefined;
        let sourceSectionId: string | undefined;

        for (const section of prevSections) {
          const item = section.items.find(i => isRuleGroup(i) && i.id === groupId);
          if (item && isRuleGroup(item)) {
            groupToMove = item;
            sourceSectionId = section.id;
            break;
          }
        }

        if (!groupToMove || !sourceSectionId || sourceSectionId === targetSectionId) {
          return prevSections;
        }

        // Remove from source section and add to target section
        return prevSections.map(section => {
          if (section.id === sourceSectionId) {
            return {
              ...section,
              items: section.items.filter(i => !(isRuleGroup(i) && i.id === groupId)),
            };
          } else if (section.id === targetSectionId) {
            return {
              ...section,
              items: [...section.items, groupToMove],
            };
          }
          return section;
        });
      });

      console.log('Moved group:', groupId, 'to section:', targetSectionId);
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
            ? { ...section, items: [newRule] }
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
          const item = section.items.find(i => !isRuleGroup(i) && i.id === ruleId);
          if (item && !isRuleGroup(item)) {
            ruleToMove = item;
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
              items: section.items.filter(i => !((!isRuleGroup(i)) && i.id === ruleId)),
            };
          } else if (section.id === targetSectionId) {
            return {
              ...section,
              items: [ruleToMove], // Ghost section starts with this rule
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

  // Calculate matching profiles using query engine with debounce
  const [matchingProfiles, setMatchingProfiles] = useState(0);

  useEffect(() => {
    if (!schema) {
      setMatchingProfiles(0);
      return;
    }

    // Set calculating state immediately
    setIsCalculating(true);

    // Debounce calculation by 500ms
    const timeoutId = setTimeout(() => {
      try {
        // Convert sections to query conditions
        const conditions = sectionsToConditionGroup(sections, schema);

        // Calculate using query engine
        const count = calculateAudienceSize(customers, conditions);
        setMatchingProfiles(count);
      } catch (error) {
        console.error('Error calculating audience size:', error);
        setMatchingProfiles(0); // Fallback to 0 on error
      } finally {
        setIsCalculating(false);
      }
    }, 500);

    // Cleanup: cancel pending calculation if dependencies change again
    return () => clearTimeout(timeoutId);
  }, [sections, customers, schema]);

  const reachedGoals = 0; // TODO: Calculate based on goals section

  // Check if we have any COMPLETE rules (property + operator + value)
  const hasCompleteRule = sections.some(section =>
    section.items.some(item => {
      if (isRuleGroup(item)) return false; // Skip groups for now
      if (!item.operator) return false;

      // Some operators don't need values (isTrue, isFalse, time-based)
      const operatorsWithoutValue = ['isTrue', 'isFalse', 'last7days', 'last30days', 'last90days'];
      if (operatorsWithoutValue.includes(item.operator)) return true;

      // Other operators need a value
      return item.value !== undefined && item.value !== '';
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
          hasHistoricalData={hasHistoricalData}
          isLoadingData={isLoadingData}
          onLoadHistoricalData={handleOpenHistoricalDataModal}
          onUnpublish={handleUnpublish}
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
                    activeSectionName={sections.find(s => s.id === activeSectionId)?.title || 'section'}
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
                  sectionSelectionMode={sectionSelectionMode}
                  sectionSelectedRules={sectionSelectedRules}
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
                  onEnterSelectionMode={handleEnterSelectionMode}
                  onExitSelectionMode={handleExitSelectionMode}
                  onToggleRuleSelection={handleToggleRuleSelection}
                  onGroupSelected={handleGroupSelected}
                  onUngroupGroup={handleUngroupGroup}
                  onGroupMatchTypeChange={handleGroupMatchTypeChange}
                  onRenameGroup={handleRenameGroup}
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
                    hasGoals={(sections.find(s => s.id === 'goals')?.items.length ?? 0) > 0}
                    hasExitConditions={(sections.find(s => s.id === 'exit')?.items.length ?? 0) > 0}
                    isCalculating={isCalculating}
                  />
                </Box>
              )}
            </>
          ) : (
            <>
              {/* VIEW MODE LAYOUT */}

              {/* Left: Dashboard */}
              <Box flex="1" display="flex" justifyContent="center" pt={2} px={6} pb={6}>
                <Dashboard
                  matchingProfiles={matchingProfiles}
                  sections={sections}
                  customers={customers}
                  syncDestinations={syncDestinations}
                  experimentMode={experimentMode}
                  hasHistoricalData={hasHistoricalData}
                  isLoadingData={isLoadingData}
                  loadingProgress={loadingProgress}
                  showSuccessBanner={showSuccessBanner}
                  onLoadHistoricalData={handleOpenHistoricalDataModal}
                  onCancelLoading={handleCancelLoading}
                  onDismissSuccess={handleDismissSuccess}
                />
              </Box>

              {/* Right: Audience Summary Panel */}
              <Box pt={2} px={6} pb={6} display="flex" flexDirection="column" alignItems="flex-start">
                <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={6}>
                  Definition
                </Text>
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
              {('property' in activeDragItem)
                ? activeDragItem.property.name
                : isRuleGroup(activeDragItem)
                  ? (activeDragItem.name || 'Unnamed Group')
                  : activeDragItem.propertyName
              }
            </Box>
          ) : null}
        </DragOverlay>

        {/* Historical Data Modal */}
        <HistoricalDataModal
          isOpen={isHistoricalDataModalOpen}
          onClose={() => setIsHistoricalDataModalOpen(false)}
          onLoadData={handleLoadHistoricalData}
        />
      </Box>
    </DndContext>
  );
}

export default AudienceBuilderPage;
