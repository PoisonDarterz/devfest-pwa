export const USE_NODE_BACKEND = import.meta.env.VITE_USE_NODE_BACKEND !== 'false';
export const NODE_API_BASE_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000/api';

export interface RewardItem {
  id: string;
  title: string;
  subtitle: string;
  isUnlocked: boolean;
  isRedeemed: boolean;
  requiredStamps: number;
  currentStamps: number;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  qrPayload: string;
  ticketType?: string;
}

export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('devfest_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
