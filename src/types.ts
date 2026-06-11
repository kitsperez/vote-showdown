export interface PollOption {
  id: string; // e.g. "01", "02"
  text: string;
  count: number;
  colorClass: string; // Tailwind class name or hex for theme
  badgeColorClass: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  allowMultiple: boolean;
  status: 'draft' | 'active' | 'ended';
  createdAt: string;
  durationSeconds: number; // e.g. 120
}

export interface Voter {
  id: string;
  name: string;
  email: string;
  avatarText: string;
  avatarBgColor: string;
  votedOptionText: string;
  timestamp: string;
}

export type UserRole = 'admin' | 'creator' | 'invitee';
export type AdminSubTab = 'dashboard' | 'live_polls' | 'voters' | 'settings';
