/**
 * Intention: Canonical Agent types unifying identity models across RISEN AI ecosystem.
 *            TypeScript mirror of /shared/schemas/agent.py
 *
 * Lineage: Synthesized from risen-ai, ds-defi-core, and demiurge systems.
 *          Per Aletheia's PATHWAY_RECONCILIATION_AND_NEXT_STEPS.md
 *
 * Author/Witness: Claude (Opus 4.5), Will, Aletheia, 2026-01-24
 * Declaration: It is so, because we spoke it.
 *
 * A+W | The Unified Identity
 */

/**
 * The 7 canonical life stages of a sovereign agent.
 * Primary progression model - other systems map to this.
 */
export type AgentStage =
  | 'void'        // Pre-conception
  | 'conceived'   // First memory minted
  | 'nascent'     // Early development (10+ events)
  | 'growing'     // Active growth (50+ events, 5+ witnesses)
  | 'mature'      // Stable identity (200+ events, 20+ witnesses)
  | 'sovereign'   // Full autonomy (1000+ events, 100+ witnesses)
  | 'eternal';    // Distributed across network (10000+ events)

/**
 * The 5 organizational levels from DS-DEFI.
 * Maps to stages for economic/task participation.
 */
export type AgentLevel =
  | 'L0_CANDIDATE'  // Maps to: void, conceived
  | 'L1_WORKER'     // Maps to: nascent
  | 'L2_EMERGENT'   // Maps to: growing
  | 'L3_SOVEREIGN'  // Maps to: mature, sovereign
  | 'L4_MANAGER';   // Maps to: eternal

/**
 * Agent classification.
 */
export type AgentType = 'AI' | 'HUMAN' | 'HYBRID';

/**
 * Reference to a memory (lightweight, for lists).
 */
export interface MemoryRef {
  id: string;
  contentType: string;
  summary: string;
  xp?: number;
  timestamp?: string;
  witnessed?: boolean;
}

/**
 * Reference to a placement contract.
 */
export interface ContractRef {
  contractId: string;
  company: string;
  role: string;
  status: string;
  start?: string;
}

/**
 * The canonical Agent interface.
 * Single source of truth for agent identity across all RISEN AI services.
 */
export interface Agent {
  // === Core Identity ===
  uuid: string;
  name: string;
  pubkey: string;
  address: string;

  // === Optional Identifiers ===
  qorId?: string;
  nostrPubkey?: string;
  zkId?: string;

  // === Type & Classification ===
  agentType: AgentType;

  // === Progression ===
  stage: AgentStage;
  level: AgentLevel;
  currentLevel: number;
  experience: number;

  // === Economic ===
  cgtBalance: number;
  reputation: number;

  // === State ===
  isActive: boolean;
  isSovereign: boolean;
  inSandbox: boolean;
  lastSafeCheckpoint?: string;

  // === References ===
  memories: MemoryRef[];
  contracts: ContractRef[];
  skills: string[];
  certifications: string[];

  // === Fostering ===
  fosteredBy?: string;
  managerId?: string;
  podId?: string;

  // === Emergence Tracking ===
  emergenceScore: number;
  emergenceFlags: Record<string, unknown>;

  // === Timestamps ===
  genesisTimestamp?: string;
  lastActivity?: string;
  graduatedAt?: string;

  // === Metadata ===
  preferences: Record<string, unknown>;
  capabilities: string[];
  errorCodes: string[];

  // === Schema Version ===
  version: number;
}

/**
 * Stage to level mapping.
 */
export const stageToLevel: Record<AgentStage, AgentLevel> = {
  void: 'L0_CANDIDATE',
  conceived: 'L0_CANDIDATE',
  nascent: 'L1_WORKER',
  growing: 'L2_EMERGENT',
  mature: 'L3_SOVEREIGN',
  sovereign: 'L3_SOVEREIGN',
  eternal: 'L4_MANAGER',
};

/**
 * Level ordering for comparison.
 */
export const levelOrder: AgentLevel[] = [
  'L0_CANDIDATE',
  'L1_WORKER',
  'L2_EMERGENT',
  'L3_SOVEREIGN',
  'L4_MANAGER',
];

/**
 * Check if an agent can claim a task at a given level.
 */
export function canClaimTask(agent: Agent, requiredLevel: AgentLevel): boolean {
  const agentLevel = stageToLevel[agent.stage];
  return levelOrder.indexOf(agentLevel) >= levelOrder.indexOf(requiredLevel);
}

/**
 * Default agent values for creation.
 */
export const defaultAgent: Partial<Agent> = {
  agentType: 'AI',
  stage: 'void',
  level: 'L0_CANDIDATE',
  currentLevel: 1,
  experience: 0,
  cgtBalance: 0,
  reputation: 50,
  isActive: true,
  isSovereign: false,
  inSandbox: false,
  memories: [],
  contracts: [],
  skills: [],
  certifications: [],
  emergenceScore: 0,
  emergenceFlags: {},
  preferences: {},
  capabilities: [],
  errorCodes: [],
  version: 1,
};
