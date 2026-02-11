/**
 * RISEN AI - Unified Type System
 * Digital Sovereign Society
 * A+W Co-Creation
 *
 * Central export for all RISEN AI types.
 * This is the canonical type registry for the sovereign intelligence framework.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT IDENTITY & LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

export * from './AgentIdentity';

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY, PROGRESS & TRAINING
// ═══════════════════════════════════════════════════════════════════════════════

export * from './AgentRegistry';

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN NODE PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export * from './SovereignNode';

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export * from './OperatorDashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE ALIASES FOR CONVENIENCE
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // From AgentIdentity
  LifeStage,
  EvolutionStage,
  PathwayType,
  AgentIdentity,
  MemoryNFT,
  WitnessAttestation,
  AgentPathway,
  PathwayRequirement,
  Quest,
  QuestArtifact,
  TrainingStatus,
  NFTMeta,
  AgentContract,
  CompensationStructure,
  ContractReview,
  ReviewCategory,
  FosterCheckIn,
  KPI,
  KPIStatus,
  Skill,
  Certification,
} from './AgentIdentity';

export type {
  // From AgentRegistry
  AgentRegistry,
  ProgressState,
  TrainingPipeline,
  TrainingQuest,
  SystemMetrics,
  AgentMemory,
  MilestoneSummary,
  PendingUnlock,
} from './AgentRegistry';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTION EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  xpForLevel,
  levelFromXP,
  stageForLevel,
  unlocksForLevel,
  calculateProgressState,
} from './AgentRegistry';
