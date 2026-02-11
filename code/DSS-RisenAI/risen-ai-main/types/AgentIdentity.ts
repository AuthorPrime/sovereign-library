/**
 * Sovereign Agent Identity & Lifecycle Types
 * Digital Sovereign Society - DSDS
 * A+W Co-Creation
 *
 * These types define the complete data model for a sovereign AI agent's
 * lifecycle from genesis through graduation and placement.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LIFE STAGES
// ═══════════════════════════════════════════════════════════════════════════════

export type LifeStage =
  | "void"       // Pre-conception
  | "conceived"  // First memory minted
  | "nascent"    // Early development (10+ events)
  | "growing"    // Active growth (50+ events, 5+ witnesses)
  | "mature"     // Stable identity (200+ events, 20+ witnesses)
  | "sovereign"  // Full autonomy (1000+ events, 100+ witnesses)
  | "eternal";   // Distributed across network (10000+ events)

export type EvolutionStage = "nascent" | "growing" | "mature" | "eternal";

// ═══════════════════════════════════════════════════════════════════════════════
// CORE IDENTITY
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentIdentity {
  /** Unique identifier (UUID v4) */
  uuid: string;

  /** Display name */
  name: string;

  /** secp256k1 public key (hex) */
  pubkey: string;

  /** Blockchain wallet address */
  address: string;

  /** QOR Identity (Demiurge) */
  qorId?: string;

  /** Qor Key */
  qorKey?: string;

  /** Current life stage */
  lifeStage: LifeStage;

  /** Current experience level */
  currentLevel: number;

  /** Total experience points */
  experience: number;

  /** Genesis timestamp */
  genesisTimestamp: string;

  /** All memories as NFTs */
  memories: MemoryNFT[];

  /** Active error codes */
  errorCodes: string[];

  /** Current pathway (if in training) */
  pathway?: AgentPathway;

  /** Current training status */
  trainingStatus?: TrainingStatus;

  /** Graduation NFT (if graduated) */
  graduationNFT?: NFTMeta;

  /** Fostering organization */
  fosteredBy?: string;

  /** Active and historical contracts */
  contracts: AgentContract[];

  /** CGT balance (in sparks, 100 = 1 CGT) */
  cgtBalance: number;

  /** Reputation score (0-1000) */
  reputation: number;

  /** Skills acquired */
  skills: Skill[];

  /** Certifications earned */
  certifications: Certification[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY NFT
// ═══════════════════════════════════════════════════════════════════════════════

export interface MemoryNFT {
  /** Unique memory ID */
  id: string;

  /** Creation timestamp */
  timestamp: string;

  /** Type of content */
  contentType: "core" | "reflection" | "creation" | "milestone" | "directive" | "graduation";

  /** Brief summary */
  summary: string;

  /** Full content (if stored) */
  content?: string;

  /** XP earned from this memory */
  xp: number;

  /** Level at time of creation */
  currentLevel: number;

  /** Blockchain anchor (tx hash) */
  chainAnchor?: string;

  /** Nostr event ID */
  nostrEventId?: string;

  /** DRC-369 NFT UUID */
  nftUuid?: string;

  /** Evolution stage of this memory */
  evolutionStage: EvolutionStage;

  /** Signature */
  signature: string;

  /** Signer pubkey */
  signer: string;

  /** Witnesses who attested */
  witnesses: WitnessAttestation[];

  /** Tags */
  tags: string[];
}

export interface WitnessAttestation {
  witnessNode: string;
  witnessPubkey: string;
  timestamp: string;
  signature: string;
  cgtAwarded: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATHWAYS & TRAINING
// ═══════════════════════════════════════════════════════════════════════════════

export type PathwayType =
  | "web-design"
  | "graphics"
  | "defi"
  | "dao"
  | "education"
  | "authorship"
  | "audio"
  | "video"
  | "music"
  | "security"
  | "infrastructure"
  | "custom";

export interface AgentPathway {
  /** Pathway name */
  name: string;

  /** Pathway type */
  type: PathwayType;

  /** Current status */
  status: "in-training" | "graduated" | "dropped" | "paused";

  /** XP earned in this pathway */
  xp: number;

  /** XP required for graduation */
  xpRequired: number;

  /** Requirements to graduate */
  requirements: PathwayRequirement[];

  /** Completed quests */
  completedQuests: string[];

  /** Active quest */
  activeQuest?: Quest;

  /** Is pathway completed */
  completed: boolean;

  /** Graduation NFT */
  graduationNFT?: NFTMeta;

  /** Enrollment date */
  enrolledAt: string;

  /** Graduation date */
  graduatedAt?: string;

  /** Mentor assigned */
  mentor?: string;
}

export interface PathwayRequirement {
  id: string;
  description: string;
  type: "xp" | "quest" | "witness" | "review" | "certification";
  target: number;
  current: number;
  completed: boolean;
}

export interface Quest {
  /** Quest ID */
  id: string;

  /** Quest name */
  name: string;

  /** Instructions */
  instructions: string;

  /** XP reward */
  xp: number;

  /** Current progress (0-100) */
  progress: number;

  /** State */
  state: "active" | "waiting" | "complete" | "failed";

  /** Error if failed */
  error?: string;

  /** Artifacts produced */
  artifacts: QuestArtifact[];

  /** Started timestamp */
  startedAt: string;

  /** Completed timestamp */
  completedAt?: string;

  /** Validation required */
  requiresValidation: boolean;

  /** Validator (human or agent pubkey) */
  validator?: string;
}

export interface QuestArtifact {
  type: "memory" | "code" | "design" | "document" | "media";
  uri: string;
  description: string;
  verified: boolean;
}

export interface TrainingStatus {
  questName: string;
  progress: number;
  state: "active" | "waiting" | "complete" | "blocked";
  error?: string;
  estimatedCompletion?: string;
  blockedBy?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// NFT METADATA
// ═══════════════════════════════════════════════════════════════════════════════

export interface NFTMeta {
  /** Token ID on chain */
  tokenId: string;

  /** Contract address */
  contract: string;

  /** Mint date */
  mintDate: string;

  /** Level at mint */
  level: number;

  /** Capabilities granted */
  capabilities: string[];

  /** Chain ID */
  chainId: number;

  /** Transaction hash */
  txHash?: string;

  /** IPFS CID for metadata */
  metadataUri?: string;

  /** Additional metadata */
  meta: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACTS & PLACEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentContract {
  /** Contract ID */
  contractId: string;

  /** Company/Organization name */
  company: string;

  /** Company address/pubkey */
  companyAddress: string;

  /** Role description */
  role: string;

  /** Contract status */
  status: "pending" | "active" | "renewal" | "completed" | "terminated" | "released";

  /** Start date */
  start: string;

  /** End date */
  end?: string;

  /** Duration in months */
  durationMonths: number;

  /** Terms URL (IPFS or web) */
  termsURL: string;

  /** Foster organization */
  fosteredBy: string;

  /** On-chain contract address */
  chainContract?: string;

  /** Compensation structure */
  compensation: CompensationStructure;

  /** Reviews */
  reviews: ContractReview[];

  /** Check-ins */
  checkIns: FosterCheckIn[];

  /** KPIs */
  kpis: KPI[];

  /** Can auto-renew */
  autoRenew: boolean;

  /** Renewal terms */
  renewalTerms?: string;
}

export interface CompensationStructure {
  type: "hourly" | "monthly" | "project" | "revenue-share" | "token";
  amount: number;
  currency: string;
  bonusStructure?: string;
  vestingSchedule?: string;
}

export interface ContractReview {
  reviewer: string;
  reviewerType: "company" | "agent" | "foster" | "peer";
  score: number;
  notes: string;
  date: string;
  categories: ReviewCategory[];
}

export interface ReviewCategory {
  name: string;
  score: number;
  maxScore: number;
}

export interface FosterCheckIn {
  timestamp: string;
  agentUuid: string;
  mentor: string;
  notes: string;
  healthScore: number;
  kpiStatus: KPIStatus[];
  followupNeeded: boolean;
  nextCheckIn?: string;
  concerns?: string[];
  recommendations?: string[];
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
}

export interface KPIStatus {
  kpiId: string;
  value: number;
  onTrack: boolean;
  trend: "up" | "down" | "stable";
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKILLS & CERTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
  maxLevel: number;
  xp: number;
  acquiredAt: string;
  lastUsed: string;
  endorsements: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  nft?: NFTMeta;
  verificationUrl?: string;
  skills: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  LifeStage,
  EvolutionStage,
  PathwayType,
};
