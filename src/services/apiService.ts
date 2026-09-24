/**
 * ApiService Facade
 *
 * Aggregates modularized services into a unified API layer for full backward compatibility:
 * - authService: User authentication, registration, profiles, whitelist
 * - sessionsService: Conference agenda, tracks, RSVP, attendee lists
 * - friendsService: Connections, NFC Bump, QR scan exchange, attendee details
 * - rewardsService: Booths, stamp collection, rewards catalog, blind box gacha
 * - notificationsService: Announcements, mark read, unread counts, broadcasts
 * - faqService: Conference FAQs
 */

import { authService } from './authService';
import { sessionsService } from './sessionsService';
import { friendsService } from './friendsService';
import { rewardsService } from './rewardsService';
import { notificationsService } from './notificationsService';
import { faqService } from './faqService';

// Re-export shared configuration and types
export type { RewardItem, UserProfile } from './apiConfig';
export { USE_NODE_BACKEND, NODE_API_BASE_URL, getAuthHeaders, handleAuthUnauthorized } from './apiConfig';

// Re-export individual modular services for direct imports
export {
  authService,
  sessionsService,
  friendsService,
  rewardsService,
  notificationsService,
  faqService,
};

// Unified Facade Object (Zero-breaking-change backward compatibility)
export const ApiService = {
  ...sessionsService,
  ...rewardsService,
  ...faqService,
  ...authService,
  ...notificationsService,
  ...friendsService,
};

export default ApiService;
