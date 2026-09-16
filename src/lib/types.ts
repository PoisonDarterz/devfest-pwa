export interface AttendeeTicket {
  id: string;
  email: string;
  fullName: string;
  ticketType: 'VIP Attendee' | 'Standard Attendee' | 'Speaker' | 'Organizer' | 'Sponsor';
  isCheckedIn: boolean;
  checkedInAt?: string;
  qrPayload: string;
  seatZone?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  companyRole?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  nfcToken?: string;
}

export interface Booth {
  id: string;
  name: string;
  category: 'Cloud' | 'AI / ML' | 'Mobile & Web' | 'Community' | 'Gold Sponsor' | 'Platinum Sponsor' | string;
  description: string;
  boothCode: string;
  logoText?: string;
  logoUrl?: string;
  points: number;
  location: string;
}

export interface Connection {
  id: string;
  user: UserProfile;
  connectedAt: string;
  method: 'NFC Bump' | 'QR Scan' | 'Direct Link';
}

export interface FriendConnection {
  id: string;
  name: string;
  displayName: string;
  role: string;
  bio: string;
  avatar?: string;
  photoUrl?: string;
  initials: string;
  color: string;
  githubUrl?: string;
  linkedinUrl?: string;
  email?: string;
  qrPayload?: string;
  method?: string;
  connectedAt?: string;
}

export interface Session {
  id: string;
  title: string;
  speaker: {
    name: string;
    role: string;
    avatar: string;
  };
  track: 'AI / ML' | 'Cloud & DevOps' | 'Mobile & Flutter' | 'Web & Chrome' | 'Keynote' | string;
  room: string;
  time: string;
  description: string;
  rsvpCount?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'session_alert' | 'lucky_draw' | 'organizer_announcement' | string;
  targetTrack?: string;
  scheduledAt?: string;
  createdAt?: string;
  isRead?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'Venue & Access' | 'Peatix & Tickets' | 'WiFi & Apps' | 'Booths & Prizes' | string;
}
