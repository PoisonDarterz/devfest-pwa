import type { Booth, Session, FAQItem } from '../lib/types';

export interface RewardItem {
  id: string;
  title: string;
  subtitle: string;
  isUnlocked: boolean;
  isRedeemed: boolean;
  requiredStamps: number;
  currentStamps: number;
}

export const MOCK_BOOTHS: Booth[] = [
  { id: 'b1', name: '42KL', category: 'Community', logoText: '42 KL | Sunway Education Group', location: 'Hall A - #01', description: 'Peer-to-peer coding school in Sunway Education Group.', boothCode: 'BOOTH-42KL', points: 15 },
  { id: 'b2', name: 'Google Cloud Malaysia', category: 'Platinum Sponsor', logoText: 'Google Cloud', location: 'Hall A - #02', description: 'Enterprise cloud infrastructure, Kubernetes & BigQuery solutions.', boothCode: 'BOOTH-GCP', points: 15 },
  { id: 'b3', name: 'Flutter Community', category: 'Community', logoText: 'Flutter MY', location: 'Hall A - #04', description: 'Cross-platform app development community in Malaysia.', boothCode: 'BOOTH-FLUTTER', points: 15 },
  { id: 'b4', name: 'TensorFlow & Gemini AI', category: 'Gold Sponsor', logoText: 'TensorFlow', location: 'Hall B - #10', description: 'Machine learning, model fine-tuning and Gemini API workshops.', boothCode: 'BOOTH-GEMINI', points: 15 },
];

export const MOCK_SESSIONS: Session[] = [
  {
    id: 's1',
    title: 'Develop multi agent system with Agent Development Kit',
    speaker: {
      name: 'Liam & Megan Kasselberg',
      role: 'Senior UX Writer & GDE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    track: 'AI / ML',
    room: 'Main Auditorium',
    time: '10:30 AM',
    description: 'Liam speaks with Megan Kasselberg, whose work as a senior UX writer and content designer touches billions of users through the Material Design system.',
  },
  {
    id: 's2',
    title: 'From Docker to Docker Compose Workflows',
    speaker: {
      name: 'Sarah Lim',
      role: 'DevOps Lead @ TechScale',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    },
    track: 'Cloud & DevOps',
    room: 'Hall A (Tech Stage)',
    time: '11:30 AM',
    description: 'Learn best practices for multi-container orchestration, development setup, and production deployment pipeline security.',
  },
  {
    id: 's3',
    title: 'Getting Started with MCP, ADK and A2A Architectures',
    speaker: {
      name: 'Jonas Tan',
      role: 'Staff AI Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    track: 'AI / ML',
    room: 'Hall B (Web Stage)',
    time: '02:00 PM',
    description: 'Explore Model Context Protocol (MCP), Agent Development Kit, and Agent-to-Agent protocol paradigms.',
  },
];

export const MOCK_FAQS: FAQItem[] = [
  {
    question: 'How do I check in with my Peatix ticket?',
    answer: 'Sign in with your Google account used on Peatix. Your QR code will be generated automatically for entry scanning.',
    category: 'Peatix & Tickets',
  },
  {
    question: 'Where is Google DevFest KL 2026 located?',
    answer: 'KL Convention Centre (KLCC), Level 3 Grand Ballroom. Accessible via LRT Kelana Jaya Line & MRT Putrajaya Line.',
    category: 'Venue & Access',
  },
  {
    question: 'How does the NFC Phone Bump feature work?',
    answer: 'On Android Chrome, tap "Friends" and hold devices back-to-back to swap contact profiles automatically!',
    category: 'WiFi & Apps',
  },
];

export const MOCK_REWARDS: RewardItem[] = [
  {
    id: 'gemini-1',
    title: '7 days Free Gemini Pro',
    subtitle: 'Valid until 31/12/2026. First come first served basis.',
    isUnlocked: true,
    isRedeemed: false,
    requiredStamps: 1,
    currentStamps: 1,
  },
  {
    id: 'blindbox-1',
    title: 'GDGKL Blind Box',
    subtitle: 'Collect 5 stamps from partner booths to unlock.',
    isUnlocked: false,
    isRedeemed: false,
    requiredStamps: 5,
    currentStamps: 2,
  },
  {
    id: 'gemini-redeemed',
    title: '7 days Free Gemini Pro',
    subtitle: 'Valid until 31/12/2026. First come first served basis.',
    isUnlocked: true,
    isRedeemed: true,
    requiredStamps: 1,
    currentStamps: 1,
  },
];

export const MOCK_DISCOVERED_FRIEND = {
  name: 'Jonas Chuan',
  role: 'Participant',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
};

export const MOCK_USER_PROFILE = {
  id: 'usr_123',
  name: 'Zixu Cheah',
  role: 'Software Engineer',
  email: 'zixu.cheah@devfest.kl',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  qrPayload: 'DEVFEST-KL-2026-ZIXU-CHEAH-SW',
};
