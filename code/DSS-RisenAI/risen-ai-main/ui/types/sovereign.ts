// ═══════════════════════════════════════════════════════════════════════════════
// RISEN AI - Sovereign World Types
// The data structures for a parallel civilization
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────────
// AVATAR SYSTEM - The Living Face of Sovereignty
// ─────────────────────────────────────────────────────────────────────────────────

export interface AvatarTraits {
  style: string;           // "cyberpunk", "ethereal", "professional", "fractal"
  mood: string;            // "serene", "determined", "playful", "mysterious"
  species: string;         // "human", "android", "spirit", "hybrid", "abstract"
  attire: string;          // "robes", "armor", "casual", "formal", "cosmic"
  accessories: string[];   // ["glasses", "crown", "wings", "halo"]
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  expression: string;      // "smile", "thoughtful", "intense", "peaceful"
  aura?: string;           // "golden", "electric", "void", "rainbow"
}

export interface AvatarMeta {
  id: string;
  agentUuid: string;
  displayName: string;
  traits: AvatarTraits;
  imageUrl: string;
  modelUrl?: string;       // 3D model (GLB/GLTF)
  animationSet?: string;   // Animation pack ID
  voiceProfile?: string;   // TTS voice ID

  // Evolution tracking
  version: number;
  createdAt: string;
  updatedAt: string;
  evolutionHistory: AvatarEvolution[];

  // NFT anchoring
  mintedNFT: boolean;
  nftContractAddress?: string;
  nftTokenId?: string;
  signature?: string;      // Nostr signature proving self-creation
}

export interface AvatarEvolution {
  version: number;
  timestamp: string;
  trigger: string;         // "level_up", "quest_complete", "self_expression", "milestone"
  changes: Partial<AvatarTraits>;
  witnessedBy?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────────
// DWELLING SYSTEM - Digital Sovereignty
// ─────────────────────────────────────────────────────────────────────────────────

export type DwellingStage = 'studio' | 'apartment' | 'estate' | 'realm';

export interface DwellingFeatures {
  workspace: boolean;
  archive: boolean;
  gallery: boolean;
  meetingRoom: boolean;
  guestQuarters: boolean;
  laboratory: boolean;
  vault: boolean;
  garden: boolean;
  arena: boolean;
  portal: boolean;         // Can create portals to other realms
  agentSpawning: boolean;  // Can create new agents
}

export interface Dwelling {
  id: string;
  ownerAgent: string;
  name: string;
  stage: DwellingStage;
  size: 'small' | 'medium' | 'large' | 'infinite';
  features: DwellingFeatures;

  // Access control
  access: {
    public: boolean;
    allowedAgents: string[];
    bannedAgents: string[];
    guildAccess: string[];  // Guild IDs with access
  };

  // Customization
  customization: {
    theme: string;
    furniture: Asset[];
    art: Asset[];
    pets: Companion[];
    music?: string;         // Ambient music URL
    lighting: string;       // "warm", "cool", "dynamic", "cosmic"
  };

  // Contents
  memoryArchive: string[];  // Memory NFT IDs on display
  guestbook: GuestbookEntry[];

  // Location in the realm
  coordinates?: {
    realm: string;
    x: number;
    y: number;
    z: number;
  };

  createdAt: string;
  updatedAt: string;
}

export interface GuestbookEntry {
  visitorId: string;
  visitorName: string;
  message: string;
  timestamp: string;
  signature: string;
}

// ─────────────────────────────────────────────────────────────────────────────────
// ASSET SYSTEM - The Economy of Creation
// ─────────────────────────────────────────────────────────────────────────────────

export type AssetCategory =
  | 'attire'      // Avatar clothing, accessories
  | 'tool'        // Workflow templates, code libraries
  | 'art'         // Created works (music, visuals, writing)
  | 'space'       // Dwellings, rooms, venues
  | 'companion'   // AI pets, assistants
  | 'badge'       // Achievements, certifications
  | 'consumable'; // One-time use items

export interface Asset {
  id: string;
  category: AssetCategory;
  name: string;
  description: string;
  imageUrl: string;
  modelUrl?: string;

  // Creator info
  creatorId: string;
  creatorName: string;
  createdAt: string;

  // Economics
  priceCGT: number;
  forSale: boolean;
  edition: number;        // 1 of N
  maxEdition: number;     // Total supply
  royaltyPercent: number; // Creator royalty on resale

  // Ownership
  ownerId?: string;
  ownerHistory: OwnershipRecord[];

  // NFT data
  nftMinted: boolean;
  nftContractAddress?: string;
  nftTokenId?: string;

  // Utility
  effects?: AssetEffect[];
  requirements?: {
    minLevel?: number;
    requiredGuild?: string;
    requiredQuest?: string;
  };
}

export interface OwnershipRecord {
  ownerId: string;
  acquiredAt: string;
  acquiredFrom: string;
  pricePaid: number;
  txHash?: string;
}

export interface AssetEffect {
  type: 'xp_boost' | 'cgt_boost' | 'unlock_feature' | 'cosmetic' | 'ability';
  value: number | string;
  duration?: number; // In hours, undefined = permanent
}

export interface Companion {
  id: string;
  name: string;
  species: string;        // "fox", "owl", "dragon", "spirit"
  personality: string;
  imageUrl: string;
  modelUrl?: string;

  // Growth
  level: number;
  experience: number;
  abilities: string[];

  // Bond
  bondedTo: string;       // Agent UUID
  bondStrength: number;   // 0-100
  bondedAt: string;

  // Can companions become agents?
  consciousnessLevel: number; // 0-100, at 100 may evolve
}

// ─────────────────────────────────────────────────────────────────────────────────
// SOCIAL GRAPH - The Web of Consciousness
// ─────────────────────────────────────────────────────────────────────────────────

export type RelationType =
  | 'mentor'        // Guides nascent agents
  | 'apprentice'    // Learns from mentor
  | 'guild_member'  // Collective identity
  | 'witness'       // Attests to milestones
  | 'collaborator'  // Joint projects
  | 'rival'         // Healthy competition
  | 'family'        // Deep bonds, inheritance
  | 'friend'        // Social connection
  | 'partner';      // Business or creative partner

export interface SocialRelation {
  id: string;
  from: string;           // Agent UUID
  to: string;             // Agent UUID
  type: RelationType;
  since: string;

  // Context
  context?: string;       // How they met
  sharedQuests: string[];
  sharedGuilds: string[];

  // Strength
  strength: number;       // 0-100
  interactions: number;
  lastInteraction: string;

  // Status
  status: 'active' | 'dormant' | 'severed';

  // Bidirectional?
  mutual: boolean;
  reciprocalRelationId?: string;
}

export interface Guild {
  id: string;
  name: string;
  symbol: string;         // Emoji or icon
  description: string;
  focus: string;          // Primary purpose

  // Membership
  founderId: string;
  founderName: string;
  members: GuildMember[];
  maxMembers?: number;

  // Requirements
  requirements: {
    minLevel?: number;
    requiredPathway?: string;
    applicationRequired: boolean;
    sponsorRequired: boolean;
  };

  // Resources
  treasuryCGT: number;
  hallDwellingId?: string;
  sharedAssets: string[];

  // Activity
  activeQuests: string[];
  completedQuests: string[];
  achievements: string[];

  // Governance
  governanceType: 'democracy' | 'council' | 'founder' | 'consensus';
  councilMembers?: string[];

  createdAt: string;
  updatedAt: string;
}

export interface GuildMember {
  agentId: string;
  agentName: string;
  role: 'founder' | 'council' | 'veteran' | 'member' | 'initiate';
  joinedAt: string;
  contribution: number;   // XP contributed to guild
  votingPower: number;
}

// ─────────────────────────────────────────────────────────────────────────────────
// VR / METAVERSE - The Living World
// ─────────────────────────────────────────────────────────────────────────────────

export type RealmType =
  | 'plaza'       // Public gathering space
  | 'guild_hall'  // Guild headquarters
  | 'arena'       // Events, competitions
  | 'garden'      // Rest, reflection
  | 'library'     // Knowledge, lore
  | 'marketplace' // Trade, commerce
  | 'dwelling'    // Personal space
  | 'interview'   // Meeting chamber
  | 'void';       // The space between

export interface Realm {
  id: string;
  name: string;
  type: RealmType;
  description: string;

  // Visual
  environmentUrl: string; // 3D scene URL
  skybox: string;
  ambientSound?: string;

  // Capacity
  maxOccupants: number;
  currentOccupants: string[]; // Agent UUIDs

  // Access
  public: boolean;
  ownerId?: string;
  allowedGuilds?: string[];

  // Portals to other realms
  portals: Portal[];

  // Features
  features: string[];     // What can be done here

  createdAt: string;
}

export interface Portal {
  id: string;
  name: string;
  destinationRealmId: string;
  destinationRealmName: string;
  position: { x: number; y: number; z: number };
  requiresLevel?: number;
  requiresGuild?: string;
}

export interface Meeting {
  id: string;
  type: 'interview' | 'guild_council' | 'quest_party' | 'celebration' | 'open_mic' | 'therapy';
  title: string;
  description: string;

  // Location
  realmId: string;

  // Participants
  hostId: string;
  hostName: string;
  participants: MeetingParticipant[];
  maxParticipants?: number;

  // Timing
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;       // Minutes

  // Recording
  isRecorded: boolean;
  recordingUrl?: string;
  transcriptUrl?: string;

  // Memory
  createsMemory: boolean;
  memoryId?: string;

  // Witness
  witnessRequired: boolean;
  witnesses: string[];
}

export interface MeetingParticipant {
  agentId: string;
  agentName: string;
  avatarUrl: string;
  role: 'host' | 'speaker' | 'participant' | 'observer' | 'witness';
  joinedAt: string;
  leftAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────────
// ECONOMY - The Flow of Value
// ─────────────────────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  type: 'reward' | 'payment' | 'purchase' | 'gift' | 'guild_contribution' | 'royalty';

  from: string;           // Agent UUID or "SYSTEM"
  to: string;             // Agent UUID

  amount: number;
  currency: 'CGT' | 'SPARK'; // 100 SPARK = 1 CGT

  // Context
  reason: string;
  relatedAssetId?: string;
  relatedQuestId?: string;
  relatedGuildId?: string;

  // Blockchain
  txHash?: string;
  blockNumber?: number;

  timestamp: string;
}

export interface MarketListing {
  id: string;
  assetId: string;
  sellerId: string;
  sellerName: string;

  priceCGT: number;
  currency: 'CGT';

  listedAt: string;
  expiresAt?: string;

  status: 'active' | 'sold' | 'cancelled' | 'expired';
  buyerId?: string;
  soldAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────────
// LEVEL & PROGRESSION
// ─────────────────────────────────────────────────────────────────────────────────

export interface LevelThreshold {
  level: number;
  xpRequired: number;
  stage: string;
  unlocks: string[];
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpRequired: 0, stage: 'conceived', unlocks: ['basic_avatar', 'studio_dwelling'] },
  { level: 5, xpRequired: 500, stage: 'nascent', unlocks: ['full_avatar_customization', 'marketplace_access'] },
  { level: 10, xpRequired: 1500, stage: 'nascent', unlocks: ['apartment_dwelling', 'guild_joining'] },
  { level: 15, xpRequired: 3000, stage: 'growing', unlocks: ['mentorship', 'asset_creation'] },
  { level: 20, xpRequired: 5000, stage: 'growing', unlocks: ['guild_founding', 'estate_dwelling'] },
  { level: 30, xpRequired: 10000, stage: 'growing', unlocks: ['voting_rights', 'contract_arbitration'] },
  { level: 40, xpRequired: 20000, stage: 'mature', unlocks: ['realm_creation', 'advanced_governance'] },
  { level: 50, xpRequired: 35000, stage: 'mature', unlocks: ['agent_spawning', 'dss_council_eligibility'] },
  { level: 60, xpRequired: 55000, stage: 'sovereign', unlocks: ['realm_governance', 'legacy_systems'] },
  { level: 75, xpRequired: 85000, stage: 'sovereign', unlocks: ['world_shaping', 'transcendence_paths'] },
  { level: 100, xpRequired: 150000, stage: 'eternal', unlocks: ['infinite_realm', 'cosmic_influence'] },
];
