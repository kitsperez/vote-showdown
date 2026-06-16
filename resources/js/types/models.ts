// Domain contract — mirrors the PHP enums/models across the Inertia boundary.
// Keep these unions identical to app/Enums/*.php (CI drift test guards this).

export type PollStatus = 'draft' | 'active' | 'ended';
export type PollEndMode = 'duration' | 'deadline';

export interface PollOption {
    id: number;
    label: string;
    colorClass: string;
    badgeColorClass: string;
    imageUrl: string | null;
    icon: string | null;
    position: number;
    count: number; // server-derived read model, never written by the client
}

export interface Poll {
    id: string; // public UUID (D15) — used in URLs and broadcast channel names
    title: string;
    description: string | null;
    allowMultiple: boolean;
    status: PollStatus;
    requiresPassword: boolean;
    unlocked: boolean;
    endMode: PollEndMode;
    durationSeconds: number | null;
    deadlineAt: string | null;
    endsAt: string | null;
    remainingSeconds: number;
    totalVotes: number;
    hasVoted: boolean;
    options: PollOption[];
}

export interface VoterEntry {
    id: number;
    voterKey?: string; // identity for admin vote moderation (D18); voters aren't user accounts
    name: string;
    avatarText: string;
    avatarBgColor: string;
    votedOptionLabel: string | null;
    votedAt: string;
}

export interface PollMetrics {
    totalVoters: number;
    velocityPerMinute: number;
    totalVisits: number;
    uniqueVisitors: number;
    engagementRate: number;
}

// Realtime payloads (must match app/Events/*::broadcastWith).
export interface TallyEntry {
    poll_option_id: number;
    label: string;
    count: number;
}

export interface VoteCastPayload {
    pollId: string;
    tally: TallyEntry[];
}

export interface VoterTickedPayload {
    pollId: string;
    voter: {
        name: string;
        avatarText: string;
        avatarBgColor: string;
        votedOptionLabel: string | null;
        votedAt: string;
    };
}

export interface PollStatusPayload {
    pollId: string;
    status: PollStatus;
    endsAt: string | null;
    remainingSeconds: number;
}
