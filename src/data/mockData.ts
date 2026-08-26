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
  {
    id: 's4',
    title: 'Advanced Fine-Tuning with Google Gemma',
    speaker: {
      name: 'Dr. Evelyn Carter',
      role: 'AI Researcher @ Google DeepMind',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    },
    track: 'AI / ML',
    room: 'Main Auditorium',
    time: '12:30 PM',
    description: 'Deep dive into LoRA, QLoRA, and reinforcement learning with human feedback (RLHF) techniques using Google Gemma model family.',
  },
  {
    id: 's5',
    title: 'Kubernetes Autoscale and Multi-Region Deployments',
    speaker: {
      name: 'Marcus Chen',
      role: 'Solutions Architect @ GCP',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    },
    track: 'Cloud & DevOps',
    room: 'Hall A (Tech Stage)',
    time: '01:30 PM',
    description: 'Explore HPA, VPA, Karpenter autoscaling, and global multi-region traffic routing strategies on GKE.',
  },
  {
    id: 's6',
    title: 'Flutter 4: What is new in Cross-Platform Mobile',
    speaker: {
      name: 'Aisha Rahman',
      role: 'GDE in Flutter',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    },
    track: 'Mobile & Flutter',
    room: 'Hall B (Web Stage)',
    time: '12:00 PM',
    description: 'Learn about the latest compilation targets, performance enhancements, and Impeller engine details in Flutter 4.',
  },
  {
    id: 's7',
    title: 'Building Custom MCP Servers for Codebase Context',
    speaker: {
      name: 'Ravi Kumar',
      role: 'Senior Developer Advocate',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    },
    track: 'Keynote',
    room: 'Main Auditorium',
    time: '03:30 PM',
    description: 'Learn how to extend LLM capabilities with custom tools and data services by building your own Model Context Protocol server.',
  },
  {
    id: 's8',
    title: 'GitOps Pipelines with ArgoCD & Terraform',
    speaker: {
      name: 'Elena Rostova',
      role: 'Platform Engineer @ GitFlow',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    },
    track: 'Cloud & DevOps',
    room: 'Hall A (Tech Stage)',
    time: '04:00 PM',
    description: 'Automate cluster state configuration and infrastructure provisioning safely via Git commits using declarative tooling.',
  },
  {
    id: 's9',
    title: 'Building Next-Gen PWAs with Vite and Workbox',
    speaker: {
      name: 'Kenji Sato',
      role: 'Frontend Architect',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    },
    track: 'Web & Chrome',
    room: 'Hall B (Web Stage)',
    time: '03:00 PM',
    description: 'Maximize offline capability, precaching, background sync, and notification pushes using Vite PWA configs.',
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
  role: 'Mobile Developer',
  company: 'GDG Kuala Lumpur',
  email: 'jonas.chuan@devfest.kl',
  bio: 'Building Android apps & PWAs. Passionate about Kotlin, Flutter, and web performance!',
  avatar: '',
  githubUrl: 'https://github.com/jonaschuan',
  linkedinUrl: 'https://linkedin.com/in/jonaschuan',
};

export const MOCK_USER_PROFILE = {
  id: 'usr_123',
  name: 'Zixu Cheah',
  role: 'Software Engineer',
  email: 'zixu.cheah@devfest.kl',
  avatar: '',
  qrPayload: 'DEVFEST-KL-2026-ZIXU-CHEAH-SW',
};
