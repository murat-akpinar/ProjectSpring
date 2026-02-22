export interface DashboardStats {
  totalOpen: number;
  totalInProgress: number;
  totalTesting: number;
  totalCompleted: number;
  totalOverdue: number;
  totalPostponed: number;
  totalCancelled: number;
}

export interface UserLeaderboard {
  userId: number;
  userName: string;
  count: number;
}

export interface TeamMember {
  userId: number;
  userName: string;
  roles: string[];
  isLeader: boolean;
}

export interface DashboardDetails {
  stats: DashboardStats;
  topCompleters: UserLeaderboard[];
  topPostponers: UserLeaderboard[];
  topCancellers: UserLeaderboard[];
  teamMembers: TeamMember[];
}

