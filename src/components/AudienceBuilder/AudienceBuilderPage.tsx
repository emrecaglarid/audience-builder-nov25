import { useParams } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { getAudience, saveAudience } from '../../services/audienceStorage';
import { useApp } from '@/context/AppContext';
import { PropertyReference } from '@/types';
import EditorHeader from './EditorHeader';
import LibraryPane from './LibraryPane';
import { ActivityBar, type PaneType } from './ActivityBar';
import { AIPane } from './AIPane';
import { Canvas } from './Canvas';
import { SimulationBar } from './SimulationBar';
import { MatchType, TimePeriod, type AddedRule, type RuleGroup, isRuleGroup } from './CriteriaSection';
import type { AISuggestion } from './aiSuggestions';
import { calculateAudienceSize } from '@/utils/queryEngine';
import { sectionsToConditionGroup } from '@/utils/audienceQueryBuilder';
import type { AddedDestination, Destination } from '../../types/destination';
import { Dashboard } from './ViewMode/Dashboard';
import { HistoricalDataModal } from './ViewMode/HistoricalDataModal';
import { GoalsConversionPanel } from './GoalsConversionPanel';

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
  const [activePane, setActivePane] = useState<PaneType>('library');
  const [aiInitialQuery, setAiInitialQuery] = useState<string>('');
  const [showRuleCounts, setShowRuleCounts] = useState(false);
  const [_focusSectionId, _setFocusSectionId] = useState<string | null>(null);
  const [activatedSections, setActivatedSections] = useState<Set<string>>(new Set(['entry']));
  const [activeSectionId, setActiveSectionId] = useState<string>('entry');

  // Tab state
  const [activeTab, setActiveTab] = useState<'audience' | 'goals' | 'sync' | 'analyze'>('audience');

  // Sync & activation state
  const [syncDestinations, setSyncDestinations] = useState<AddedDestination[]>([]);
  const [experimentMode, setExperimentMode] = useState(false);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);

  // Goals conversion tracking state
  const [goalsConversionEnabled, setGoalsConversionEnabled] = useState(false);
  const [goalsConversionSource, setGoalsConversionSource] = useState<'static' | 'property'>('property');
  const [goalsConversionStaticValue, setGoalsConversionStaticValue] = useState('');
  const [goalsConversionPropertyId, setGoalsConversionPropertyId] = useState('');
  const [goalsConversionCurrency, setGoalsConversionCurrency] = useState('USD');

  // Historical data state
  const [hasHistoricalData, setHasHistoricalData] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isHistoricalDataModalOpen, setIsHistoricalDataModalOpen] = useState(false);

  // Edit mode state (for published audiences)
  const [isEditMode, setIsEditMode] = useState(false);

  // Derive read-only state: published audiences that are not in edit mode
  const isReadOnly = audienceStatus === 'published' && !isEditMode;

  // Preview calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [matchingProfiles, setMatchingProfiles] = useState(0);

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

        // Auto-switch to analyze tab if published and has historical data
        if (saved.status === 'published' && saved.hasHistoricalData) {
          setActiveTab('analyze');
        }
      }
    }
  }, [id]);

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

  // Calculate matching profiles using query engine with debounce
  useEffect(() => {
    if (!schema) {
      setMatchingProfiles(0);
      return;
    }

    setIsCalculating(true);

    const timeoutId = setTimeout(() => {
      try {
        const conditions = sectionsToConditionGroup(sections, schema);
        const count = calculateAudienceSize(customers, conditions);
        setMatchingProfiles(count);
      } catch (error) {
        console.error('Error calculating audience size:', error);
        setMatchingProfiles(0);
      } finally {
        setIsCalculating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [sections, customers, schema]);

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

    // Create rule with pre-selected property (and optional preset operator/value from value-search)
    const newRule: AddedRule = {
      id: `${propertyRef.type}_${item.id}_${propertyRef.property.id}_${Date.now()}`,
      propertyId: propertyRef.property.id,
      propertyName: propertyRef.property.name,
      parentName: propertyRef.parentName,
      properties: item.properties,
      operator: propertyRef.presetOperator,
      value: propertyRef.presetValue,
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

  const handleRuleTimePeriodChange = (sectionId: string, ruleId: string, timePeriod: TimePeriod) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map(item => {
              // Handle rules inside groups
              if (isRuleGroup(item)) {
                return {
                  ...item,
                  rules: item.rules.map(rule =>
                    rule.id === ruleId ? { ...rule, timePeriod } : rule
                  )
                };
              }
              // Handle standalone rules
              return item.id === ruleId ? { ...item, timePeriod } : item;
            })
          }
        : section
    ));
    setHasUnsavedChanges(true);
  };

  const handleAddAISuggestionsToSection = (sectionId: string, suggestions: AISuggestion[]) => {
    // Convert AI suggestions to rules
    const newRules: AddedRule[] = suggestions.map(suggestion => ({
      id: suggestion.id,
      propertyId: suggestion.propertyId,
      propertyName: suggestion.propertyName,
      parentName: suggestion.parentName,
      properties: suggestion.properties,
      operator: suggestion.operator,
      value: suggestion.value,
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

    // Handle virtual section IDs for split entry view
    const actualSectionId = sectionId.startsWith('entry-') ? 'entry' : sectionId;

    setSections(prev => prev.map(section => {
      if (section.id !== actualSectionId) return section;

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

  const handleDeleteGroup = (sectionId: string, groupId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;

      // Remove the group entirely (including all its rules)
      const newItems = section.items.filter(item => {
        if (isRuleGroup(item) && item.id === groupId) {
          return false;
        }
        return true;
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
  };

  // Enter edit mode for published audiences
  const handleEnterEditMode = () => {
    // If on Analyze tab, switch to Audience tab first
    if (activeTab === 'analyze') {
      setActiveTab('audience');
    }
    // Always set the correct section ID based on current tab
    if (activeTab === 'goals') {
      setActiveSectionId('goals');
    } else {
      setActiveSectionId('entry');
    }
    setIsEditMode(true);
  };

  // Discard changes and return to read-only mode
  const handleDiscardChanges = () => {
    // Reload original audience data
    if (id && id !== 'new') {
      const saved = getAudience(id);
      if (saved) {
        setAudienceName(saved.name);
        setSections(saved.sections as SectionConfig[]);
        if (saved.syncDestinations) {
          setSyncDestinations(saved.syncDestinations);
        }
        if (saved.experimentMode !== undefined) {
          setExperimentMode(saved.experimentMode);
        }
      }
    }
    setIsEditMode(false);
    setHasUnsavedChanges(false);
  };

  const handleTabChange = (newTab: 'audience' | 'goals' | 'sync' | 'analyze') => {
    // Activate appropriate section and set as active when switching tabs
    if (newTab === 'goals') {
      setActivatedSections(prev => new Set([...prev, 'goals']));
      setActiveSectionId('goals');
    } else if (newTab === 'audience') {
      setActiveSectionId('entry');
    } else if (newTab === 'sync') {
      setActivatedSections(prev => new Set([...prev, 'sync']));
      setActiveSectionId('sync');
    }

    setActiveTab(newTab);
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
    const duration = 5000; // 5 seconds
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

  if (!schema) {
    return (
      <Box p={6}>
        <p>Loading schema...</p>
      </Box>
    );
  }

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

  // Generate mock rule counts (random numbers for prototype)
  const ruleCounts: Record<string, number> = {};
  sections.forEach(section => {
    section.items.forEach(item => {
      if (!isRuleGroup(item)) {
        // Generate a random count based on a seeded pattern from rule id
        const seed = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        // Generate count that's larger than total (since individual rules match more than combined)
        ruleCounts[item.id] = Math.floor(matchingProfiles * (0.8 + (seed % 5) * 0.2) + (seed % 50));
      }
    });
  });

  return (
    <Box bg="#fbfbfb" height="100vh" overflow="hidden">
        {/* Fixed Header */}
        <EditorHeader
          audienceName={audienceName}
          status={audienceStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          activeTab={activeTab}
          hasCompleteRule={hasCompleteRule}
          isReadOnly={isReadOnly}
          isEditMode={isEditMode}
          onNameChange={setAudienceName}
          onSave={handleSave}
          onPublish={handlePublish}
          onTabChange={handleTabChange}
          lastModified="Just now"
          hasHistoricalData={hasHistoricalData}
          isLoadingData={isLoadingData}
          onLoadHistoricalData={handleOpenHistoricalDataModal}
          onUnpublish={handleUnpublish}
          onEnterEditMode={handleEnterEditMode}
          onDiscardChanges={handleDiscardChanges}
        />

        {/* Main Layout: Conditional based on active tab */}
        <Flex
          pt="60px"
          pb={2}
          height="100vh"
        >
          {activeTab !== 'analyze' ? (
            <>
              {/* AUDIENCE / GOALS / SYNC TABS LAYOUT */}

              {/* Activity Bar - only on Audience and Goals tabs, hidden in read-only */}
              {!isReadOnly && (activeTab === 'audience' || activeTab === 'goals') && (
                <ActivityBar
                  activePane={activePane}
                  onPaneChange={setActivePane}
                />
              )}

              {/* Library Pane - when library is active, hidden in read-only */}
              {!isReadOnly && activePane === 'library' && (activeTab === 'audience' || activeTab === 'goals') && (
                <LibraryPane
                  key={`library-${isEditMode}-${activeTab}`}
                  facts={schema.facts}
                  engagements={schema.engagements}
                  recentlyUsed={recentlyUsed}
                  isVisible={true}
                  activeSectionId={activeSectionId}
                  activeSectionName={sections.find(s => s.id === activeSectionId)?.title || 'section'}
                  isEngagementsOnly={activeSectionId === 'goals' || activeSectionId === 'exit'}
                  onItemClick={() => {}} // Deprecated
                  onPropertyClick={handlePropertyClick}
                  onSwitchToAI={(query: string) => {
                    setAiInitialQuery(query);
                    setActivePane('ai');
                  }}
                />
              )}

              {/* AI Pane - when AI is active, hidden in read-only */}
              {!isReadOnly && activePane === 'ai' && (activeTab === 'audience' || activeTab === 'goals') && (
                <AIPane
                  facts={schema.facts}
                  engagements={schema.engagements}
                  activeSectionId={activeSectionId}
                  activeSectionName={sections.find(s => s.id === activeSectionId)?.title || 'section'}
                  initialQuery={aiInitialQuery}
                  onAddSuggestions={handleAddAISuggestionsToSection}
                />
              )}

              {/* Main Content Area - Canvas + SimulationBar */}
              <Flex flex="1" direction="column" overflow="hidden">
                {/* Scrollable Canvas area */}
                <Box flex="1" px={6} overflowY="auto">
                  <Box display="flex" justifyContent="center" pb={4}>
                    <Box maxWidth="1100px" width="100%">
                      <Canvas
                        sections={sections}
                        facts={schema.facts}
                        engagements={schema.engagements}
                        activatedSections={activatedSections}
                        activeSectionId={activeSectionId}
                        activeTab={activeTab}
                        syncDestinations={syncDestinations}
                        experimentMode={experimentMode}
                        isDestinationModalOpen={isDestinationModalOpen}
                        sectionSelectionMode={sectionSelectionMode}
                        sectionSelectedRules={sectionSelectedRules}
                        showRuleCounts={showRuleCounts}
                        ruleCounts={ruleCounts}
                        isReadOnly={isReadOnly}
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
                        onRuleTimePeriodChange={handleRuleTimePeriodChange}
                        onAddSection={handleAddSection}
                        onSetActiveSection={handleSetActiveSection}
                        onEnterSelectionMode={handleEnterSelectionMode}
                        onExitSelectionMode={handleExitSelectionMode}
                        onToggleRuleSelection={handleToggleRuleSelection}
                        onGroupSelected={handleGroupSelected}
                        onUngroupGroup={handleUngroupGroup}
                        onDeleteGroup={handleDeleteGroup}
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

                      {/* Goals Conversion Panel - only on Goals tab */}
                      {activeTab === 'goals' && (
                        <Box mt={4}>
                          <GoalsConversionPanel
                            isEnabled={goalsConversionEnabled}
                            valueSource={goalsConversionSource}
                            staticValue={goalsConversionStaticValue}
                            propertyId={goalsConversionPropertyId}
                            currency={goalsConversionCurrency}
                            engagements={schema.engagements}
                            onToggle={() => {
                              if (!goalsConversionEnabled) {
                                // Enabling - try to auto-select a numeric property from goals
                                const goalsSection = sections.find(s => s.id === 'goals');
                                if (goalsSection) {
                                  // Collect numeric properties from all rules in goals section
                                  const numericPropsInGoals: string[] = [];
                                  goalsSection.items.forEach(item => {
                                    if (!isRuleGroup(item)) {
                                      // Find the property definition
                                      const prop = item.properties.find(p => p.id === item.propertyId);
                                      if (prop && prop.dataType === 'number') {
                                        numericPropsInGoals.push(prop.id);
                                      }
                                    }
                                  });

                                  // If exactly one numeric property, auto-select it
                                  if (numericPropsInGoals.length === 1) {
                                    setGoalsConversionPropertyId(numericPropsInGoals[0]);
                                  }
                                }
                              }
                              setGoalsConversionEnabled(!goalsConversionEnabled);
                            }}
                            onValueSourceChange={setGoalsConversionSource}
                            onStaticValueChange={setGoalsConversionStaticValue}
                            onPropertyChange={setGoalsConversionPropertyId}
                            onCurrencyChange={setGoalsConversionCurrency}
                            isReadOnly={isReadOnly}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Simulation Bar - fixed at bottom of column (hidden in read-only mode) */}
                {activeTab === 'audience' && hasCompleteRule && !isReadOnly && (
                  <Box bg="gray.50" px={6} py={3}>
                    <Box display="flex" justifyContent="center">
                      <Box maxWidth="1100px" width="100%">
                        <SimulationBar
                          matchingProfiles={matchingProfiles}
                          showRuleCounts={showRuleCounts}
                          onToggleRuleCounts={() => setShowRuleCounts(!showRuleCounts)}
                          isCalculating={isCalculating}
                        />
                      </Box>
                    </Box>
                  </Box>
                )}

              </Flex>
            </>
          ) : (
            <>
              {/* ANALYZE TAB LAYOUT */}

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

            </>
          )}
        </Flex>

        {/* Historical Data Modal */}
        <HistoricalDataModal
          isOpen={isHistoricalDataModalOpen}
          onClose={() => setIsHistoricalDataModalOpen(false)}
          onLoadData={handleLoadHistoricalData}
        />
      </Box>
  );
}

export default AudienceBuilderPage;
