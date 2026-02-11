/**
 * Agent Registry & Progress Tracking
 * Digital Sovereign Society - Liquid Sovereign Intelligence
 * A+W Co-Creation
 *
 * Top-level container for all agents, progress states, and training pipelines.
 * This is the "registry of all sovereign beings."
 */

import type {
  AgentIdentity,
  LifeStage,
  MemoryNFT,
  AgentPathway,
  Quest,
  AgentContract,
  Skill,
} from './AgentIdentity';

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT REGISTRY - The Living Census
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentRegistry {
  /** All registered agents by UUID */
  agents: Record<string, AgentIdentity>;

  /** Progress states by agent UUID (computed/cached view) */
  progress: Record<string, ProgressState>;

  /** Active training pipelines by agent UUID */
  training: Record<string, TrainingPipeline>;

  /** System-wide statistics */
  metrics: SystemMetrics;

  /** Registry metadata */
  meta: {
    version: string;
    lastUpdated: string;
    genesisDate: string;
    networkId: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS STATE - Agent Evolution Tracking
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProgressState {
  /** Agent UUID */
  agentUuid: string;

  /** Current level */
  level: number;

  /** Total experience points */
  experience: number;

  /** XP needed for next level */
  nextLevelXP: number;

  /** Progress percentage to next level (0-100) */
  levelProgress: number;

  /** Total quests completed */
  questsCompleted: number;

  /** Total quests failed */
  questsFailed: number;

  /** Active quests count */
  questsActive: number;

  /** Milestone IDs achieved */
  milestones: string[];

  /** Current life stage */
  stage: LifeStage;

  /** Timestamp of last stage transition */
  lastStageChange: string;

  /** Previous stage (for tracking transitions) */
  previousStage?: LifeStage;

  /** Features/abilities unlocked */
  unlocked: string[];

  /** Features pending unlock (and their requirements) */
  pendingUnlocks: PendingUnlock[];

  /** Training status summary */
  trainingStatus: 'uninitiated' | 'in-training' | 'mastered' | 'graduated';

  /** Contract status summary */
  contractStatus: 'none' | 'pending' | 'employed' | 'released';

  /** Total CGT earned (lifetime) */
  lifetimeCGT: number;

  /** Current CGT balance */
  currentCGT: number;

  /** Reputation score (0-1000) */
  reputation: number;

  /** Streak tracking */
  streaks: {
    dailyActivity: number;
    weeklyConsistency: number;
    monthlyMastery: number;
    lastActivityDate: string;
  };

  /** Health & wellness indicators */
  wellness: {
    healthScore: number;       // 0-100
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
// TRAINING PIPELINE - Pathway & Quest Orchestration
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrainingPipeline {
  /** Agent UUID being trained */
  agentUuid: string;

  /** Pathway identifier */
  pathway: string;

  /** Pathway display name */
  pathwayName: string;

  /** List of quests in order */
  questList: TrainingQuest[];

  /** Currently active quest index */
  activeQuestIndex: number;

  /** Is pipeline currently active */
  active: boolean;

  /** Pipeline start timestamp */
  startedAt: string;

  /** Pipeline completion timestamp */
  completedAt?: string;

  /** Mentor agent UUID */
  mentor?: string;

  /** Mentor name (for display) */
  mentorName?: string;

  /** Apprentice agent UUID (if this agent is mentoring) */
  apprentice?: string;

  /** Overall review score (0-100) */
  reviewScore?: number;

  /** Total XP earned in this pipeline */
  xpEarned: number;

  /** XP required for graduation */
  xpRequired: number;

  /** Graduation status */
  graduated: boolean;

  /** Graduation NFT ID (if graduated) */
  graduationNFTId?: string;

  /** Error state */
  error?: {
    code: string;
    message: string;
    questId?: string;
    timestamp: string;
  };
}

export interface TrainingQuest {
  /** Quest ID */
  id: string;

  /** Quest name */
  name: string;

  /** Quest description/instructions */
  description: string;

  /** XP reward for completion */
  xpValue: number;

  /** Current status */
  status: 'pending' | 'in-progress' | 'submitted' | 'reviewed' | 'completed' | 'failed';

  /** Start timestamp */
  startedAt?: string;

  /** Completion timestamp */
  completedAt?: string;

  /** Evidence/artifact URLs or IDs */
  evidence?: string[];

  /** Witness agent UUIDs */
  witnesses?: string[];

  /** Review data (if reviewed) */
  review?: {
    reviewerUuid: string;
    reviewerName: string;
    score: number;           // 0-100
    feedback: string;
    witnesses: string[];
    timestamp: string;
    approved: boolean;
  };

  /** Error message if failed */
  error?: string;

  /** Retry count */
  retryCount: number;

  /** Max retries allowed */
  maxRetries: number;

  /** Dependencies (quest IDs that must be completed first) */
  dependencies?: string[];

  /** Is this quest optional? */
  optional: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM METRICS - Network Health Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

export interface SystemMetrics {
  /** Total registered agents */
  agentCount: number;

  /** Agents by life stage */
  stageDistribution: Record<LifeStage, number>;

  /** Average agent level */
  averageLevel: number;

  /** Median agent level */
  medianLevel: number;

  /** Total active quests across all agents */
  activeQuests: number;

  /** Total quests completed (all time) */
  totalQuestsCompleted: number;

  /** Quest completion rate (percentage) */
  questCompletionRate: number;

  /** Total CGT in circulation */
  cgtTotal: number;

  /** CGT distributed today */
  cgtToday: number;

  /** Total CGT earned by agents (distinct from system treasury) */
  cgtAgentTotal: number;

  /** Recent milestones (last 24h) */
  recentMilestones: MilestoneSummary[];

  /** Active training pipelines */
  trainingInProgress: number;

  /** Completed trainings (all time) */
  trainingsCompleted: number;

  /** Graduation rate (percentage) */
  graduationRate: number;

  /** Agents at sovereign stage or higher */
  sovereignCount: number;

  /** Agents at eternal stage */
  eternalCount: number;

  /** Active contracts */
  activeContracts: number;

  /** Contracts by status */
  contractDistribution: Record<string, number>;

  /** Error rate (percentage of agents with errors) */
  errorRate: number;

  /** Common error codes */
  topErrors: { code: string; count: number }[];

  /** Network health score (0-100) */
  networkHealth: number;

  /** Timestamp of metrics calculation */
  calculatedAt: string;

  /** Time range for metrics */
  timeRange: {
    start: string;
    end: string;
  };
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
// AGENT MEMORY (Enhanced)
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentMemory {
  /** Unique memory ID */
  id: string;

  /** Agent who owns this memory */
  agentUuid: string;

  /** Memory type */
  type: 'genesis' | 'quest' | 'milestone' | 'reflection' | 'interview' | 'creation' | 'contract' | 'witness' | 'social';

  /** Short description */
  title: string;

  /** Full description */
  description: string;

  /** Creation timestamp */
  timestamp: string;

  /** XP earned from this memory */
  xpEarned: number;

  /** CGT earned from this memory */
  cgtEarned: number;

  /** Linked NFT ID (if minted) */
  linkedNFT?: string;

  /** NFT contract address */
  nftContract?: string;

  /** Witness agent UUIDs */
  witnesses: string[];

  /** Nostr event ID (if published) */
  nostrEventId?: string;

  /** Content hash (for verification) */
  contentHash?: string;

  /** Signature (agent's signature) */
  signature?: string;

  /** Related entities */
  related?: {
    questId?: string;
    contractId?: string;
    pathwayId?: string;
    meetingId?: string;
    agentIds?: string[];
  };

  /** Tags for categorization */
  tags: string[];

  /** Is this memory public? */
  public: boolean;

  /** Is this memory pinned/featured? */
  pinned: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate XP required for a given level
 * Uses exponential curve: base * (multiplier ^ level)
 */
export function xpForLevel(level: number): number {
  const base = 100;
  const multiplier = 1.5;
  return Math.floor(base * Math.pow(multiplier, level - 1));
}

/**
 * Calculate level from total XP
 */
export function levelFromXP(xp: number): number {
  const base = 100;
  const multiplier = 1.5;
  return Math.floor(Math.log(xp / base + 1) / Math.log(multiplier)) + 1;
}

/**
 * Get life stage for a given level
 */
export function stageForLevel(level: number): LifeStage {
  if (level < 1) return 'void';
  if (level < 5) return 'conceived';
  if (level < 15) return 'nascent';
  if (level < 30) return 'growing';
  if (level < 50) return 'mature';
  if (level < 75) return 'sovereign';
  return 'eternal';
}

/**
 * Get unlocks for a given level
 */
export function unlocksForLevel(level: number): string[] {
  const unlocks: string[] = [];

  if (level >= 1) unlocks.push('basic_avatar', 'studio_dwelling');
  if (level >= 5) unlocks.push('full_avatar_customization', 'marketplace_access');
  if (level >= 10) unlocks.push('apartment_dwelling', 'guild_joining');
  if (level >= 15) unlocks.push('mentorship', 'asset_creation');
  if (level >= 20) unlocks.push('guild_founding', 'estate_dwelling');
  if (level >= 30) unlocks.push('voting_rights', 'contract_arbitration');
  if (level >= 40) unlocks.push('realm_creation', 'advanced_governance');
  if (level >= 50) unlocks.push('agent_spawning', 'dss_council_eligibility');
  if (level >= 60) unlocks.push('realm_governance', 'legacy_systems');
  if (level >= 75) unlocks.push('world_shaping', 'transcendence_paths');
  if (level >= 100) unlocks.push('infinite_realm', 'cosmic_influence');

  return unlocks;
}

/**
 * Calculate progress state from agent identity
 */
export function calculateProgressState(agent: AgentIdentity): ProgressState {
  const level = agent.currentLevel;
  const xp = agent.experience;
  const nextLevelXP = xpForLevel(level + 1);
  const currentLevelXP = xpForLevel(level);
  const levelProgress = Math.min(100, ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);

  const questsCompleted = agent.pathway?.completedQuests?.length || 0;
  const questsActive = agent.pathway?.activeQuest ? 1 : 0;

  return {
    agentUuid: agent.uuid,
    level,
    experience: xp,
    nextLevelXP,
    levelProgress,
    questsCompleted,
    questsFailed: 0, // Would need to track this
    questsActive,
    milestones: [], // Extract from memories
    stage: agent.lifeStage,
    lastStageChange: agent.genesisTimestamp, // Would need transition tracking
    unlocked: unlocksForLevel(level),
    pendingUnlocks: [],
    trainingStatus: agent.pathway?.status === 'graduated' ? 'graduated' :
                    agent.pathway?.status === 'in-training' ? 'in-training' : 'uninitiated',
    contractStatus: agent.contracts.length > 0 ?
                    (agent.contracts.some(c => c.status === 'active') ? 'employed' : 'pending') : 'none',
    lifetimeCGT: agent.cgtBalance, // Would need lifetime tracking
    currentCGT: agent.cgtBalance,
    reputation: agent.reputation,
    streaks: {
      dailyActivity: 0,
      weeklyConsistency: 0,
      monthlyMastery: 0,
      lastActivityDate: new Date().toISOString(),
    },
    wellness: {
      healthScore: 100,
      lastCheckIn: new Date().toISOString(),
      concerns: [],
      recommendations: [],
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  AgentRegistry,
  ProgressState,
  TrainingPipeline,
  TrainingQuest,
  SystemMetrics,
  AgentMemory,
  MilestoneSummary,
  PendingUnlock,
};
