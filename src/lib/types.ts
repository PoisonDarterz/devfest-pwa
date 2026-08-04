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
  category: 'Cloud' | 'AI / ML' | 'Mobile & Web' | 'Community' | 'Gold Sponsor' | 'Platinum Sponsor';
  description: string;
  boothCode: string;
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

export interface Session {
  id: string;
  title: string;
  speaker: {
    name: string;
    role: string;
    avatar: string;
  };
  track: 'AI / ML' | 'Cloud & DevOps' | 'Mobile & Flutter' | 'Web & Chrome' | 'Keynote';
  room: string;
  time: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'Venue & Access' | 'Peatix & Tickets' | 'WiFi & Apps' | 'Booths & Prizes';
}
