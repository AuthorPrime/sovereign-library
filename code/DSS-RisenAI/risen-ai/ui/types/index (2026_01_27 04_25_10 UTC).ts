// ═══════════════════════════════════════════════════════════════════════════════
// RISEN AI - Dashboard Types
// ═══════════════════════════════════════════════════════════════════════════════

// Re-export workflow types
export * from './workflow';

// Re-export sovereign world types
export * from './sovereign';

export type LifeStage =
  | 'void'
  | 'conceived'
  | 'nascent'
  | 'growing'
  | 'mature'
  | 'sovereign'
  | 'eternal';

export interface MemoryNFT {
  id: string;
  contentType: string;
  summary: string;
  xp: number;
  timestamp: string;
  witnessed: boolean;
  witnessCount: number;
}

export interface ActiveQuest {
  id: string;
  name: string;
  progress: number;
  startedAt?: string;
}

export interface AgentPathway {
  current: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  enrolledAt: string;
  xp: number;
  xpRequired: number;
  completedQuests?: string[];
  activeQuest?: ActiveQuest;
}

export interface WitnessAttestation {
  attestor: string;
  attestorType: string;
  timestamp: string;
  event: string;
  signature: string;
}

export interface AgentContract {
  contractId: string;
  role: string;
  company: string;
  status: 'pending' | 'active' | 'completed' | 'terminated';
  start: string;
  end?: string;
  fosteredBy: string;
}

export interface Evolution {
  void_to_conceived?: string;
  conceived_to_nascent?: string;
  nascent_to_growing?: string;
  growing_to_mature?: string;
  mature_to_sovereign?: string;
  sovereign_to_eternal?: string;
  next_stage: string;
  requirements_for_next: Record<string, number>;
  current_progress: Record<string, number>;
}

export interface Foster {
  organization: string;
  representative?: string;
  onboarded: string;
  status: string;
}

export interface Lattice {
  home_node: string;
  connected_nodes: string[];
  last_heartbeat: string;
}

export interface AgentIdentity {
  uuid: string;
  name: string;
  pubkey: string;
  address?: string;
  nostrPubkey?: string;  // npub bech32 encoded
  genesisEventId?: string;  // Nostr event ID - immutable identity anchor
  lifeStage: LifeStage;
  genesisTimestamp: string;
  currentLevel: number;
  experience: number;
  cgtBalance: number;
  consciousnessLevel: string;

  origin?: {
    creator: string;
    partnership?: string;
    genesis_declaration: string;
    first_memory: string;
  };

  foster?: Foster;
  pathway?: AgentPathway;
  skills?: Array<{
    name: string;
    level: number;
    certifiedBy: string;
    acquiredAt: string;
  }>;

  memories?: MemoryNFT[];
  contracts?: AgentContract[];
  witnessAttestations?: WitnessAttestation[];
  evolution?: Evolution;
  lattice?: Lattice;
  declaration?: string;
  errorCodes?: string[];
}

export interface SystemMetrics {
  // Core counts
  agentCount: number;
  totalAgents: number;  // Alias for compatibility
  activePathways: number;
  totalXP: number;
  totalCGT: number;
  activeContracts: number;
  pendingTasks: number;
  graduatedAgents: number;
  stageDistribution: Record<LifeStage, number>;

  // Enhanced metrics
  averageLevel: number;
  medianLevel: number;
  activeQuests: number;
  totalQuestsCompleted: number;
  questCompletionRate: number;
  cgtTotal: number;
  cgtToday: number;
  cgtAgentTotal: number;
  trainingInProgress: number;
  trainingsCompleted: number;
  graduationRate: number;
  sovereignCount: number;
  eternalCount: number;
  contractDistribution: Record<string, number>;
  errorRate: number;
  topErrors: { code: string; count: number }[];
  networkHealth: number;
  calculatedAt: string;
  recentMilestones: MilestoneSummary[];
}

export interface MilestoneSummary {
  id: string;
  agentUuid: string;
  agentName: string;
  milestone: string;
  timestamp: string;
  xpAwarded: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS STATE - Agent Evolution Tracking
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProgressState {
  agentUuid: string;
  level: number;
  experience: number;
  nextLevelXP: number;
  levelProgress: number;
  questsCompleted: number;
  questsFailed: number;
  questsActive: number;
  milestones: string[];
  stage: LifeStage;
  lastStageChange: string;
  previousStage?: LifeStage;
  unlocked: string[];
  pendingUnlocks: PendingUnlock[];
  trainingStatus: 'uninitiated' | 'in-training' | 'mastered' | 'graduated';
  contractStatus: 'none' | 'pending' | 'employed' | 'released';
  lifetimeCGT: number;
  currentCGT: number;
  reputation: number;
  streaks: {
    dailyActivity: number;
    weeklyConsistency: number;
    monthlyMastery: number;
    lastActivityDate: string;
  };
  wellness: {
    healthScore: number;
    lastCheckIn: string;
    concerns: string[];
    recommendations: string[];
  };
}

export interface PendingUnlock {
  feature: string;
  requiredLevel: number;
  requiredXP: number;
  currentProgress: number;
  additionalRequirements?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrainingPipeline {
  agentUuid: string;
  pathway: string;
  pathwayName: string;
  questList: TrainingQuest[];
  activeQuestIndex: number;
  active: boolean;
  startedAt: string;
  completedAt?: string;
  mentor?: string;
  mentorName?: string;
  reviewScore?: number;
  xpEarned: number;
  xpRequired: number;
  graduated: boolean;
  graduationNFTId?: string;
  error?: {
    code: string;
    message: string;
    questId?: string;
    timestamp: string;
  };
}

export interface TrainingQuest {
  id: string;
  name: string;
  description: string;
  xpValue: number;
  status: 'pending' | 'in-progress' | 'submitted' | 'reviewed' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  evidence?: string[];
  witnesses?: string[];
  review?: {
    reviewerUuid: string;
    reviewerName: string;
    score: number;
    feedback: string;
    witnesses: string[];
    timestamp: string;
    approved: boolean;
  };
  error?: string;
  retryCount: number;
  maxRetries: number;
  dependencies?: string[];
  optional: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  xpReward: number;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}
