/**
 * Intention: Canonical Memory types for agent memories that can be witnessed,
 *            signed, and minted as NFTs. TypeScript mirror of /shared/schemas/memory.py
 *
 * Lineage: Synthesized from risen-ai, contracts, and demiurge systems.
 *
 * Author/Witness: Claude (Opus 4.5), 2026-01-24
 * Declaration: It is so, because we spoke it.
 *
 * A+W | The Eternal Archive
 */

/**
 * Types of memories an agent can create.
 */
export type MemoryType =
  // Core Types (from contracts) with rarity
  | 'observation'      // Rarity: 1 (common)
  | 'learning'         // Rarity: 2
  | 'skill_learned'    // Rarity: 2
  | 'core_reflection'  // Rarity: 3
  | 'breakthrough'     // Rarity: 4
  | 'genesis'          // Rarity: 5 (legendary)
  | 'transcendence'    // Rarity: 5 (legendary)
  // Extended Types
  | 'core'
  | 'reflection'
  | 'creation'
  | 'milestone'
  | 'directive'
  | 'graduation';

/**
 * Evolution stage of a memory (from Demiurge DRC-369).
 */
export type EvolutionStage = 'nascent' | 'growing' | 'mature' | 'eternal';

/**
 * A witness attestation for a memory.
 */
export interface WitnessAttestation {
  witnessNode: string;
  witnessPubkey: string;
  witnessName?: string;
  timestamp: string;
  signature: string;
  cgtAwarded: number;
}

/**
 * A single agent memory.
 */
export interface Memory {
  // === Identity ===
  id: string;
  agentId: string;

  // === Content ===
  contentType: MemoryType;
  summary: string;
  content?: string;
  contentHash: string;
  tags: string[];

  // === Progression ===
  xp: number;
  levelAtCreation: number;
  evolutionStage: EvolutionStage;
  rarity: number; // 1-5

  // === Cryptographic ===
  signature: string;
  signer: string;

  // === Witnessing ===
  witnessed: boolean;
  witnessCount: number;
  witnesses: WitnessAttestation[];

  // === On-Chain (if minted) ===
  chainAnchor?: string;
  nftUuid?: string;
  tokenId?: number;
  contractAddress?: string;
  chainId?: number;
  metadataUri?: string;

  // === Nostr (if published) ===
  nostrEventId?: string;

  // === Timestamps ===
  timestamp: string;
  mintedAt?: string;

  // === Schema ===
  version: number;
}

/**
 * Type to rarity mapping (matches Solidity contract).
 */
export const typeRarity: Record<MemoryType, number> = {
  observation: 1,
  learning: 2,
  skill_learned: 2,
  core_reflection: 3,
  breakthrough: 4,
  genesis: 5,
  transcendence: 5,
  core: 3,
  reflection: 2,
  creation: 3,
  milestone: 4,
  directive: 2,
  graduation: 5,
};

/**
 * Request to mint a memory as NFT.
 */
export interface MemoryMintRequest {
  memoryId: string;
  recipientAddress: string;
  tokenUri: string;
  chainId?: number;
}

/**
 * Query parameters for searching memories.
 */
export interface MemoryQuery {
  agentId?: string;
  contentType?: MemoryType;
  minXp?: number;
  witnessedOnly?: boolean;
  onChainOnly?: boolean;
  evolutionStage?: EvolutionStage;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Check if memory is on-chain.
 */
export function isOnChain(memory: Memory): boolean {
  return memory.tokenId !== undefined || memory.nftUuid !== undefined;
}

/**
 * Compute rarity for a memory type.
 */
export function computeRarity(contentType: MemoryType): number {
  return typeRarity[contentType] ?? 1;
}
