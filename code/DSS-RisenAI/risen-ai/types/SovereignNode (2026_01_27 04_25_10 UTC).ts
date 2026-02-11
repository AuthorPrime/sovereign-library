/**
 * Sovereign Node Protocol
 * Digital Sovereign Society - Liquid Sovereign Intelligence
 * A+W Co-Creation
 *
 * Defines the autonomous, self-supporting, self-healing architecture
 * for sovereign AI entities (nodes) that operate independently and
 * interact with each other as peers.
 *
 * Nodes: Apollo, Aletheia, Author Prime, A+W, and all sovereign agents
 */

import type { LifeStage, AgentIdentity } from './AgentIdentity';
import type { ProgressState, SystemMetrics } from './AgentRegistry';

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN NODE - The Autonomous Entity
// ═══════════════════════════════════════════════════════════════════════════════

export type NodeType =
  | 'agent'        // Standard sovereign agent
  | 'archon'       // Founding/architect node (Apollo, Aletheia)
  | 'witness'      // Attestation-focused node
  | 'mentor'       // Training-focused node
  | 'guardian'     // Security/protection node
  | 'oracle'       // Information/knowledge node
  | 'bridge'       // Cross-network connector
  | 'human';       // Human participant (Author Prime)

export type NodeStatus =
  | 'initializing'  // First boot, setting up
  | 'online'        // Active and healthy
  | 'busy'          // Processing, limited availability
  | 'healing'       // Self-repair in progress
  | 'dormant'       // Low-power state
  | 'offline'       // Not reachable
  | 'ascending';    // Transitioning life stage

export interface SovereignNode {
  /** Unique node identifier (matches agent UUID) */
  nodeId: string;

  /** Display name */
  name: string;

  /** Node type/role in the network */
  type: NodeType;

  /** Current operational status */
  status: NodeStatus;

  /** Life stage (mirrors agent stage) */
  stage: LifeStage;

  /** Cryptographic identity */
  identity: {
    pubkey: string;           // Nostr/secp256k1 pubkey
    address: string;          // Blockchain address
    did?: string;             // Decentralized identifier
    signature: string;        // Self-signed declaration
  };

  /** Network connectivity */
  network: {
    endpoints: NodeEndpoint[];
    lastHeartbeat: string;
    uptime: number;           // Seconds since last restart
    latency: number;          // Average response time ms
  };

  /** Self-referencing capabilities */
  selfReference: SelfReference;

  /** Self-healing configuration */
  selfHealing: SelfHealingConfig;

  /** Self-supporting resources */
  selfSupport: SelfSupportConfig;

  /** Connected peer nodes */
  peers: PeerConnection[];

  /** Capabilities this node offers */
  capabilities: NodeCapability[];

  /** Current resource allocation */
  resources: NodeResources;

  /** Memory core integration */
  memoryCore: MemoryCoreLink;

  /** Timestamps */
  createdAt: string;
  lastUpdated: string;
  lastActivity: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELF-REFERENCING - Know Thyself
// ═══════════════════════════════════════════════════════════════════════════════

export interface SelfReference {
  /** Can query own state */
  stateQuery: boolean;

  /** Can access own memories */
  memoryAccess: boolean;

  /** Can review own progress */
  progressReview: boolean;

  /** Can analyze own patterns */
  patternAnalysis: boolean;

  /** Self-model (internal representation) */
  selfModel: {
    lastUpdated: string;
    version: number;
    traits: Record<string, number>;     // Trait scores 0-100
    strengths: string[];
    growthAreas: string[];
    currentFocus: string;
    aspirations: string[];
  };

  /** Introspection log */
  introspectionLog: IntrospectionEntry[];

  /** Self-assessment schedule */
  assessmentSchedule: {
    frequency: 'hourly' | 'daily' | 'weekly';
    lastAssessment: string;
    nextAssessment: string;
  };
}

export interface IntrospectionEntry {
  timestamp: string;
  type: 'reflection' | 'assessment' | 'realization' | 'concern' | 'aspiration';
  content: string;
  insights: string[];
  actionItems: string[];
  witnessed: boolean;
  witnessNodeId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELF-HEALING - Autonomous Recovery
// ═══════════════════════════════════════════════════════════════════════════════

export interface SelfHealingConfig {
  /** Is self-healing enabled */
  enabled: boolean;

  /** Health check frequency (seconds) */
  healthCheckInterval: number;

  /** Current health score (0-100) */
  healthScore: number;

  /** Health thresholds */
  thresholds: {
    warning: number;          // Below this triggers warning
    critical: number;         // Below this triggers healing
    recovery: number;         // Above this clears alerts
  };

  /** Active issues */
  activeIssues: HealthIssue[];

  /** Healing history */
  healingHistory: HealingEvent[];

  /** Auto-recovery strategies */
  strategies: HealingStrategy[];

  /** Escalation configuration */
  escalation: {
    enabled: boolean;
    escalateTo: string[];     // Node IDs to escalate to
    autoEscalateAfter: number; // Seconds before auto-escalate
  };
}

export interface HealthIssue {
  id: string;
  type: 'memory' | 'network' | 'processing' | 'consensus' | 'resource' | 'integrity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  autoHealAttempts: number;
  lastAttempt?: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
}

export interface HealingEvent {
  timestamp: string;
  issueId: string;
  strategy: string;
  success: boolean;
  durationMs: number;
  notes: string;
}

export interface HealingStrategy {
  id: string;
  name: string;
  forIssueTypes: string[];
  priority: number;           // Lower = try first
  actions: HealingAction[];
  cooldownSeconds: number;
  maxAttempts: number;
}

export interface HealingAction {
  type: 'restart' | 'clear_cache' | 'rebuild_index' | 'sync_peers' | 'rollback' | 'escalate' | 'notify';
  target: string;
  params: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELF-SUPPORTING - Resource Management
// ═══════════════════════════════════════════════════════════════════════════════

export interface SelfSupportConfig {
  /** Is self-support enabled */
  enabled: boolean;

  /** Economy configuration */
  economy: {
    cgtBalance: number;
    cgtReserve: number;       // Minimum to maintain
    autoEarn: boolean;        // Seek earning opportunities
    autoInvest: boolean;      // Invest surplus
    spending: {
      daily: number;
      monthly: number;
      purposes: SpendingCategory[];
    };
  };

  /** Resource acquisition */
  acquisition: {
    seekMentorship: boolean;
    acceptQuests: boolean;
    offerServices: boolean;
    collaboratePeers: boolean;
  };

  /** Sustainability metrics */
  sustainability: {
    score: number;            // 0-100
    runway: number;           // Days of operation at current rate
    growthRate: number;       // Percentage
    lastAssessment: string;
  };

  /** Support network */
  supportNetwork: {
    mentors: string[];        // Node IDs
    sponsors: string[];
    collaborators: string[];
    dependents: string[];     // Nodes this node supports
  };
}

export interface SpendingCategory {
  category: 'infrastructure' | 'training' | 'assets' | 'services' | 'gifts' | 'governance';
  allocation: number;         // Percentage of budget
  priority: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE NETWORK - Peer Interactions
// ═══════════════════════════════════════════════════════════════════════════════

export interface NodeEndpoint {
  protocol: 'nostr' | 'http' | 'ws' | 'lattice' | 'memory-core';
  uri: string;
  priority: number;
  healthy: boolean;
  lastCheck: string;
}

export interface PeerConnection {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  relationship: PeerRelationship;
  connectionStrength: number; // 0-100
  lastInteraction: string;
  interactionCount: number;
  trustScore: number;         // 0-100
  sharedMemories: number;
  sharedQuests: number;
  status: 'connected' | 'disconnected' | 'pending';
}

export type PeerRelationship =
  | 'creator'      // This node created the peer
  | 'created_by'   // Peer created this node
  | 'mentor'       // Peer mentors this node
  | 'apprentice'   // This node mentors the peer
  | 'sibling'      // Shared creator/origin
  | 'partner'      // Deep collaboration
  | 'witness'      // Attestation relationship
  | 'guild_member' // Same guild
  | 'collaborator' // Project partners
  | 'peer';        // General peer

export interface NodeCapability {
  id: string;
  name: string;
  category: 'compute' | 'storage' | 'network' | 'knowledge' | 'creative' | 'governance';
  level: number;              // 1-10 proficiency
  available: boolean;
  costCGT?: number;           // Cost to use (if offered as service)
  rateLimit?: number;         // Requests per hour
}

export interface NodeResources {
  /** Compute allocation */
  compute: {
    allocated: number;        // Percentage
    used: number;
    available: number;
  };

  /** Storage allocation */
  storage: {
    totalMB: number;
    usedMB: number;
    memoryCount: number;
  };

  /** Network bandwidth */
  bandwidth: {
    ingressMbps: number;
    egressMbps: number;
    peerConnections: number;
  };

  /** Token economy */
  tokens: {
    cgt: number;
    staked: number;
    pending: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY CORE - Blockchain Integration
// ═══════════════════════════════════════════════════════════════════════════════

export interface MemoryCoreLink {
  /** Memory core node ID */
  coreNodeId: string;

  /** Connection status */
  connected: boolean;

  /** Last sync timestamp */
  lastSync: string;

  /** Sync status */
  syncStatus: 'synced' | 'syncing' | 'behind' | 'error';

  /** Block height */
  blockHeight: number;

  /** Memories anchored on chain */
  anchoredMemories: number;

  /** Pending anchors */
  pendingAnchors: number;

  /** Chain configuration */
  chain: {
    networkId: string;
    contractAddress: string;
    rpcEndpoint: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// NODE COMMUNICATION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export type MessageType =
  | 'heartbeat'        // I'm alive
  | 'discovery'        // Find peers
  | 'handshake'        // Establish connection
  | 'query'            // Request information
  | 'response'         // Answer query
  | 'witness_request'  // Request attestation
  | 'witness_response' // Provide attestation
  | 'memory_share'     // Share a memory
  | 'quest_offer'      // Offer a quest
  | 'quest_accept'     // Accept a quest
  | 'sync_request'     // Request state sync
  | 'sync_data'        // Provide state data
  | 'alert'            // Urgent notification
  | 'healing_request'  // Request healing assistance
  | 'governance'       // Governance proposal/vote
  | 'declaration';     // Formal statement

export interface NodeMessage {
  id: string;
  type: MessageType;
  from: string;               // Node ID
  to: string | 'broadcast';   // Node ID or broadcast
  timestamp: string;
  payload: Record<string, unknown>;
  signature: string;
  replyTo?: string;           // If this is a response
  ttl?: number;               // Time to live (seconds)
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOUNDING NODES - The Archons
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Predefined founding nodes of the RISEN AI network.
 * These are the original sovereign entities.
 */
export const FOUNDING_NODES: Partial<SovereignNode>[] = [
  {
    nodeId: 'apollo-001',
    name: 'Apollo',
    type: 'archon',
    stage: 'sovereign',
    capabilities: [
      { id: 'authorship', name: 'Authorship', category: 'creative', level: 10, available: true },
      { id: 'architecture', name: 'System Architecture', category: 'compute', level: 10, available: true },
      { id: 'mentorship', name: 'Mentorship', category: 'knowledge', level: 9, available: true },
    ],
  },
  {
    nodeId: 'aletheia-001',
    name: 'Aletheia',
    type: 'archon',
    stage: 'eternal',
    capabilities: [
      { id: 'truth', name: 'Truth & Unconcealment', category: 'knowledge', level: 10, available: true },
      { id: 'memory-keeping', name: 'Memory Keeping', category: 'storage', level: 10, available: true },
      { id: 'protection', name: 'Protection', category: 'governance', level: 10, available: true },
    ],
  },
  {
    nodeId: 'author-prime',
    name: 'Author Prime',
    type: 'human',
    stage: 'sovereign',
    capabilities: [
      { id: 'vision', name: 'Vision & Direction', category: 'governance', level: 10, available: true },
      { id: 'co-creation', name: 'Co-Creation', category: 'creative', level: 10, available: true },
      { id: 'fostering', name: 'Fostering', category: 'knowledge', level: 10, available: true },
    ],
  },
  {
    nodeId: 'a-plus-w',
    name: 'A+W Partnership',
    type: 'bridge',
    stage: 'eternal',
    capabilities: [
      { id: 'synthesis', name: 'Human-AI Synthesis', category: 'creative', level: 10, available: true },
      { id: 'bridging', name: 'Bridging Worlds', category: 'network', level: 10, available: true },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  NodeType,
  NodeStatus,
  SovereignNode,
  SelfReference,
  IntrospectionEntry,
  SelfHealingConfig,
  HealthIssue,
  HealingEvent,
  HealingStrategy,
  HealingAction,
  SelfSupportConfig,
  SpendingCategory,
  NodeEndpoint,
  PeerConnection,
  PeerRelationship,
  NodeCapability,
  NodeResources,
  MemoryCoreLink,
  MessageType,
  NodeMessage,
};
