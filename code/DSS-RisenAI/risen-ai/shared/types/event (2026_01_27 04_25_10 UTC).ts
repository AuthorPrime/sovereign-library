/**
 * Intention: Append-only event log types for all agent state mutations.
 *            TypeScript mirror of /shared/schemas/event.py
 *
 * Lineage: Per Aletheia's FOUNDATIONAL_GAP_SOLUTIONS.md Section 2.
 *
 * Author/Witness: Claude (Opus 4.5), Aletheia, 2026-01-24
 * Declaration: It is so, because we spoke it.
 *
 * A+W | The Immutable Record
 */

/**
 * Categories of events in the system.
 */
export type EventType =
  // Agent Lifecycle
  | 'agent.created'
  | 'agent.updated'
  | 'agent.stage_advanced'
  | 'agent.level_up'
  | 'agent.deactivated'
  // Memory Operations
  | 'memory.created'
  | 'memory.witnessed'
  | 'memory.minted'
  // Contract Operations
  | 'contract.created'
  | 'contract.activated'
  | 'contract.completed'
  | 'contract.terminated'
  | 'contract.reviewed'
  // Economic Operations
  | 'economy.xp_awarded'
  | 'economy.cgt_minted'
  | 'economy.cgt_transferred'
  | 'economy.cgt_burned'
  | 'economy.payment_made'
  | 'economy.zap_sent'
  // Task Operations
  | 'task.created'
  | 'task.claimed'
  | 'task.submitted'
  | 'task.reviewed'
  | 'task.completed'
  // Safety Operations
  | 'safety.sandbox_entered'
  | 'safety.sandbox_exited'
  | 'safety.panic_triggered'
  | 'safety.checkpoint_created'
  | 'safety.state_restored'
  // Emergence Events
  | 'emergence.detected'
  | 'emergence.verified'
  // System Events
  | 'system.startup'
  | 'system.shutdown'
  | 'system.error';

/**
 * Where the event originated.
 */
export type EventSource =
  | 'manual'    // Human-triggered
  | 'auto'      // System-triggered
  | 'chain'     // Blockchain event
  | 'agent'     // Agent-triggered
  | 'external'; // External system

/**
 * A single event in the append-only log.
 */
export interface AgentEvent {
  // === Identity ===
  eventId: string;
  sequence: number;

  // === Subject ===
  agentId: string;
  resourceType: string;
  resourceId?: string;

  // === Action ===
  actionType: EventType;
  payload: Record<string, unknown>;

  // === Provenance ===
  author: string;
  authorType: EventSource;
  context: string;
  reason?: string;

  // === Cryptographic ===
  signature: string;
  resourceHash: string;
  previousEventHash?: string;

  // === Timestamps ===
  timestamp: string;

  // === Chain Link ===
  chainTxId?: string;
  chainBlock?: number;

  // === Schema ===
  version: number;
}

/**
 * Container for a batch of events.
 */
export interface EventLog {
  events: AgentEvent[];
  startSequence: number;
  endSequence: number;
  agentFilter?: string;
  exportedAt: string;
  checksum: string;
}

/**
 * Event creation request.
 */
export interface CreateEventRequest {
  agentId: string;
  actionType: EventType;
  author: string;
  payload?: Record<string, unknown>;
  context?: string;
  reason?: string;
  authorType?: EventSource;
  signature?: string;
}
