import type { Destination, PlatformType } from '../types/destination';

/**
 * Mock destinations available for syncing
 * Represents pre-configured destinations that users can select from
 */
export const availableDestinations: Destination[] = [
  // Google Ads (3 accounts)
  {
    id: 'dest-ga-1',
    platformType: 'google-ads',
    platformName: 'Google Ads',
    accountId: 'GA-8372615',
    accountName: 'ACME Marketing',
    listId: 'list-hvc-001',
    listName: 'High Value Customers',
    status: 'active',
    syncFrequency: 'daily',
    lastSyncAt: '2025-11-20T08:30:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 15234,
  },
  {
    id: 'dest-ga-2',
    platformType: 'google-ads',
    platformName: 'Google Ads',
    accountId: 'GA-8372615',
    accountName: 'ACME Marketing',
    listId: 'list-cart-002',
    listName: 'Shopping Cart Abandoners',
    status: 'active',
    syncFrequency: 'hourly',
    lastSyncAt: '2025-11-20T11:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 8421,
  },
  {
    id: 'dest-ga-3',
    platformType: 'google-ads',
    platformName: 'Google Ads',
    accountId: 'GA-9451827',
    accountName: 'ACME Retail',
    listId: 'list-season-003',
    listName: 'Seasonal Shoppers',
    status: 'paused',
    syncFrequency: 'daily',
    lastSyncAt: '2025-11-18T09:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 12156,
  },
  {
    id: 'dest-ga-4',
    platformType: 'google-ads',
    platformName: 'Google Ads',
    accountId: 'GA-7263541',
    accountName: 'ACME Europe',
    listId: 'list-emea-004',
    listName: 'EMEA Premium Segment',
    status: 'active',
    syncFrequency: 'daily',
    lastSyncAt: '2025-11-20T06:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 6892,
  },

  // Facebook (3 accounts)
  {
    id: 'dest-fb-1',
    platformType: 'facebook',
    platformName: 'Facebook Custom Audiences',
    accountId: 'FB-5847392',
    accountName: 'ACME Social',
    listId: 'ca-lookalike-001',
    listName: 'Lookalike Audience - Premium',
    status: 'active',
    syncFrequency: 'realtime',
    lastSyncAt: '2025-11-20T11:45:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 14829,
  },
  {
    id: 'dest-fb-2',
    platformType: 'facebook',
    platformName: 'Facebook Custom Audiences',
    accountId: 'FB-5847392',
    accountName: 'ACME Social',
    listId: 'ca-retarget-002',
    listName: 'Website Retargeting',
    status: 'syncing',
    syncFrequency: 'hourly',
    lastSyncAt: '2025-11-20T11:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 22341,
  },
  {
    id: 'dest-fb-3',
    platformType: 'facebook',
    platformName: 'Facebook Custom Audiences',
    accountId: 'FB-6129384',
    accountName: 'ACME Retail',
    listId: 'ca-dpa-003',
    listName: 'Dynamic Product Ads Audience',
    status: 'active',
    syncFrequency: 'realtime',
    lastSyncAt: '2025-11-20T11:42:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 18765,
  },

  // Salesforce (2 accounts)
  {
    id: 'dest-sf-1',
    platformType: 'salesforce',
    platformName: 'Salesforce Marketing Cloud',
    accountId: 'SF-4729182',
    accountName: 'ACME CRM',
    listId: 'de-leads-001',
    listName: 'Lead Scoring Segment',
    status: 'error',
    syncFrequency: 'daily',
    lastSyncAt: '2025-11-19T10:00:00Z',
    lastSyncStatus: 'failed',
    lastSyncCount: 0,
    errorMessage: 'Authentication expired. Please reconnect.',
  },
  {
    id: 'dest-sf-2',
    platformType: 'salesforce',
    platformName: 'Salesforce Marketing Cloud',
    accountId: 'SF-8362941',
    accountName: 'ACME Enterprise',
    listId: 'de-enterprise-002',
    listName: 'Enterprise Contacts',
    status: 'active',
    syncFrequency: 'weekly',
    lastSyncAt: '2025-11-18T00:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 3421,
  },

  // Braze (3 accounts)
  {
    id: 'dest-braze-1',
    platformType: 'braze',
    platformName: 'Braze',
    accountId: 'BZ-7283941',
    accountName: 'ACME Mobile',
    listId: 'seg-push-001',
    listName: 'Push Notification Segment',
    status: 'active',
    syncFrequency: 'realtime',
    lastSyncAt: '2025-11-20T11:50:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 25678,
  },
  {
    id: 'dest-braze-2',
    platformType: 'braze',
    platformName: 'Braze',
    accountId: 'BZ-7283941',
    accountName: 'ACME Mobile',
    listId: 'seg-email-002',
    listName: 'Re-engagement Campaign',
    status: 'active',
    syncFrequency: 'daily',
    lastSyncAt: '2025-11-20T09:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 12456,
  },
  {
    id: 'dest-braze-3',
    platformType: 'braze',
    platformName: 'Braze',
    accountId: 'BZ-5194827',
    accountName: 'ACME Email',
    listId: 'seg-vip-003',
    listName: 'VIP Mobile Users',
    status: 'active',
    syncFrequency: 'hourly',
    lastSyncAt: '2025-11-20T11:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 8934,
  },

  // Mailchimp (3 accounts)
  {
    id: 'dest-mc-1',
    platformType: 'mailchimp',
    platformName: 'Mailchimp',
    accountId: 'MC-3829471',
    accountName: 'ACME Newsletter',
    listId: 'list-vip-001',
    listName: 'VIP Subscribers',
    status: 'active',
    syncFrequency: 'daily',
    lastSyncAt: '2025-11-20T08:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 9876,
  },
  {
    id: 'dest-mc-2',
    platformType: 'mailchimp',
    platformName: 'Mailchimp',
    accountId: 'MC-3829471',
    accountName: 'ACME Newsletter',
    listId: 'list-weekly-002',
    listName: 'Weekly Digest Subscribers',
    status: 'active',
    syncFrequency: 'weekly',
    lastSyncAt: '2025-11-18T00:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 34521,
  },
  {
    id: 'dest-mc-3',
    platformType: 'mailchimp',
    platformName: 'Mailchimp',
    accountId: 'MC-6182934',
    accountName: 'ACME Promo',
    listId: 'list-seasonal-003',
    listName: 'Seasonal Campaigns',
    status: 'paused',
    syncFrequency: 'daily',
    lastSyncAt: '2025-11-15T10:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 15234,
  },

  // TikTok (3 accounts)
  {
    id: 'dest-tt-1',
    platformType: 'tiktok',
    platformName: 'TikTok Ads',
    accountId: 'TT-9284761',
    accountName: 'ACME Social',
    listId: 'aud-genz-001',
    listName: 'Gen Z Audience',
    status: 'active',
    syncFrequency: 'daily',
    lastSyncAt: '2025-11-20T07:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 45678,
  },
  {
    id: 'dest-tt-2',
    platformType: 'tiktok',
    platformName: 'TikTok Ads',
    accountId: 'TT-9284761',
    accountName: 'ACME Social',
    listId: 'aud-engage-002',
    listName: 'High Engagement Users',
    status: 'active',
    syncFrequency: 'hourly',
    lastSyncAt: '2025-11-20T11:00:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 28934,
  },
  {
    id: 'dest-tt-3',
    platformType: 'tiktok',
    platformName: 'TikTok Ads',
    accountId: 'TT-7193826',
    accountName: 'ACME Retail',
    listId: 'aud-shoppers-003',
    listName: 'Product Viewers',
    status: 'active',
    syncFrequency: 'realtime',
    lastSyncAt: '2025-11-20T11:48:00Z',
    lastSyncStatus: 'success',
    lastSyncCount: 52341,
  },
];

/**
 * Get platform display metadata (color, icon name, etc.)
 */
export function getPlatformMeta(platformType: PlatformType) {
  const metadata: Record<
    PlatformType,
    { color: string; bgColor: string; displayName: string }
  > = {
    'google-ads': {
      color: '#4285F4',
      bgColor: '#E8F0FE',
      displayName: 'Google Ads',
    },
    facebook: {
      color: '#1877F2',
      bgColor: '#E7F3FF',
      displayName: 'Facebook',
    },
    salesforce: {
      color: '#00A1E0',
      bgColor: '#E0F3FF',
      displayName: 'Salesforce',
    },
    braze: {
      color: '#FF6B6B',
      bgColor: '#FFE8E8',
      displayName: 'Braze',
    },
    mailchimp: {
      color: '#FFE01B',
      bgColor: '#FFFBEB',
      displayName: 'Mailchimp',
    },
    tiktok: {
      color: '#000000',
      bgColor: '#F3F4F6',
      displayName: 'TikTok',
    },
  };

  return metadata[platformType];
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string) {
  const colors: Record<string, { color: string; bgColor: string }> = {
    active: { color: 'green.700', bgColor: 'green.100' },
    paused: { color: 'gray.700', bgColor: 'gray.100' },
    error: { color: 'red.700', bgColor: 'red.100' },
    syncing: { color: 'blue.700', bgColor: 'blue.100' },
  };

  return colors[status] || colors.active;
}

/**
 * Format last sync timestamp
 */
export function formatLastSync(timestamp?: string): string {
  if (!timestamp) return 'Never';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
