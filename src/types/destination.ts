export type PlatformType =
  | 'google-ads'
  | 'facebook'
  | 'salesforce'
  | 'braze'
  | 'mailchimp'
  | 'tiktok';

export type DestinationStatus = 'active' | 'paused' | 'error' | 'syncing';

export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';

export interface Destination {
  id: string;
  platformType: PlatformType;
  platformName: string;
  accountId: string;
  accountName: string;
  listId?: string;
  listName?: string;
  status: DestinationStatus;
  syncFrequency: SyncFrequency;
  lastSyncAt?: string; // ISO timestamp
  lastSyncStatus?: 'success' | 'failed';
  lastSyncCount?: number;
  errorMessage?: string;
}

export interface AddedDestination extends Destination {
  // For experiment mode
  trafficPercentage?: number;
  experimentGroup?: string;

  // Metadata
  disabled?: boolean;
  comment?: string;
  targetAudienceName?: string;
}

export interface ExperimentConfig {
  enabled: boolean;
  name?: string;
  description?: string;
}
