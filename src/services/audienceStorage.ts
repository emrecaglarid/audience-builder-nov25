import type { MatchType, TimePeriod } from '../components/AudienceBuilder/CriteriaSection';
import type { PropertyDefinition } from '../types/schema';
import type { AddedDestination } from '../types/destination';

export interface SavedAudienceRule {
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

export interface SavedRuleGroup {
  id: string;
  type: 'group';
  matchType: MatchType;
  rules: SavedAudienceRule[];
  collapsed?: boolean;
  name?: string;
}

export interface SavedAudienceSection {
  id: string;
  title: string;
  items: (SavedAudienceRule | SavedRuleGroup)[];
  matchType: MatchType;
  timePeriod: TimePeriod;
  isCollapsed: boolean;
}

// Legacy type for backward compatibility
interface LegacySavedAudienceSection {
  id: string;
  title: string;
  rules: SavedAudienceRule[];
  matchType: MatchType;
  timePeriod: TimePeriod;
  isCollapsed: boolean;
}

export interface SavedAudience {
  id: string;
  name: string;
  sections: SavedAudienceSection[];
  status: 'draft' | 'published';
  createdAt: string;
  modifiedAt: string;
  publishedAt?: string;
  syncDestinations?: AddedDestination[];
  experimentMode?: boolean;
  hasHistoricalData?: boolean;
  historicalDataLoadedAt?: string;
}

const STORAGE_KEY = 'relay42_audiences';
const MOCK_DATA_LOADED_KEY = 'relay42_mock_data_loaded';

// Load mock audiences from public folder
async function loadMockAudiences(): Promise<SavedAudience[]> {
  try {
    const response = await fetch('/mockAudiences.json');
    if (!response.ok) {
      console.warn('Mock audiences file not found');
      return [];
    }
    const mockData = await response.json();
    return mockData;
  } catch (error) {
    console.error('Failed to load mock audiences:', error);
    return [];
  }
}

// Initialize storage with mock data if empty (first run)
export async function initializeWithMockData(): Promise<void> {
  const mockDataLoaded = localStorage.getItem(MOCK_DATA_LOADED_KEY);
  const existingAudiences = getAudiences();

  console.log('Initialize check - mockDataLoaded:', mockDataLoaded, 'existingCount:', existingAudiences.length);

  // Only load mock data if this is the first run (empty storage and flag not set)
  if (!mockDataLoaded && existingAudiences.length === 0) {
    console.log('Loading mock audiences from /mockAudiences.json...');
    const mockAudiences = await loadMockAudiences();
    console.log('Mock audiences fetched:', mockAudiences.length);
    if (mockAudiences.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAudiences));
      localStorage.setItem(MOCK_DATA_LOADED_KEY, 'true');
      console.log(`✓ Loaded ${mockAudiences.length} mock audiences into localStorage`);
    }
  } else {
    console.log('Skipping mock data load (already loaded or data exists)');
  }
}

// Manually load mock data (useful for resetting)
export async function loadMockData(): Promise<void> {
  const mockAudiences = await loadMockAudiences();
  if (mockAudiences.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAudiences));
    localStorage.setItem(MOCK_DATA_LOADED_KEY, 'true');
    console.log(`Loaded ${mockAudiences.length} mock audiences`);
  }
}

// Clear mock data flag (allows re-initialization)
export function clearMockDataFlag(): void {
  localStorage.removeItem(MOCK_DATA_LOADED_KEY);
}

// Migration function to convert old schema (rules) to new schema (items)
function migrateSectionSchema(section: any): SavedAudienceSection {
  // If section has 'rules' property (old schema), migrate to 'items'
  if ('rules' in section && !('items' in section)) {
    const { rules, ...rest } = section;
    return {
      ...rest,
      items: rules, // Rename rules to items
    };
  }
  // Already using new schema
  return section as SavedAudienceSection;
}

// Migration function for entire audience
function migrateAudienceSchema(audience: any): SavedAudience {
  return {
    ...audience,
    sections: audience.sections.map(migrateSectionSchema),
  };
}

export function saveAudience(
  audience: Omit<SavedAudience, 'id' | 'createdAt' | 'modifiedAt' | 'publishedAt'> & {
    id?: string;
    publishedAt?: string;
    historicalDataLoadedAt?: string;
  }
): SavedAudience {
  const audiences = getAudiences();

  const now = new Date().toISOString();
  const existing = audience.id ? audiences.find(a => a.id === audience.id) : null;

  const savedAudience: SavedAudience = {
    id: audience.id || `audience_${Date.now()}`,
    name: audience.name,
    sections: audience.sections,
    status: audience.status,
    createdAt: existing?.createdAt || now,
    modifiedAt: now,
    publishedAt: audience.status === 'published' ? (audience.publishedAt || now) : existing?.publishedAt,
    syncDestinations: audience.syncDestinations,
    experimentMode: audience.experimentMode,
    hasHistoricalData: audience.hasHistoricalData,
    historicalDataLoadedAt: audience.historicalDataLoadedAt,
  };

  const updatedAudiences = audience.id
    ? audiences.map(a => a.id === audience.id ? savedAudience : a)
    : [...audiences, savedAudience];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAudiences));
  return savedAudience;
}

export function getAudiences(): SavedAudience[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const audiences = JSON.parse(data);
    // Migrate each audience to new schema
    return audiences.map(migrateAudienceSchema);
  } catch (error) {
    console.error('Failed to load audiences from localStorage:', error);
    return [];
  }
}

export function getAudience(id: string): SavedAudience | null {
  const audiences = getAudiences();
  // getAudiences already migrates, so no need to migrate again
  return audiences.find(a => a.id === id) || null;
}

export function deleteAudience(id: string): void {
  const audiences = getAudiences();
  const filtered = audiences.filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
