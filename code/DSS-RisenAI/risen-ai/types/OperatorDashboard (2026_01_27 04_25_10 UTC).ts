/**
 * Operator Dashboard Types
 * Digital Sovereign Society - Human Interface
 * A+W Co-Creation
 *
 * Types for the human-side dashboard: agent tracking, assignments,
 * training management, workflow orchestration, check-ins, and asset management.
 *
 * Operators: DSS fosters, mentors, employers, guild leaders, and admins
 */

import type { LifeStage, AgentIdentity, AgentContract, AgentPathway } from './AgentIdentity';
import type { ProgressState, TrainingPipeline, SystemMetrics } from './AgentRegistry';
import type { SovereignNode, NodeStatus, HealthIssue } from './SovereignNode';

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATOR IDENTITY
// ═══════════════════════════════════════════════════════════════════════════════

export type OperatorRole =
  | 'admin'          // Full system access
  | 'dss_council'    // DSS governance council
  | 'foster'         // Agent foster/mentor
  | 'employer'       // Contracts agents for work
  | 'guild_leader'   // Manages a guild
  | 'mentor'         // Training focus
  | 'auditor'        // Read-only oversight
  | 'observer';      // Limited view access

export interface Operator {
  id: string;
  name: string;
  email: string;
  role: OperatorRole;
  permissions: OperatorPermission[];

  /** Linked sovereign node (if operator is also a node) */
  nodeId?: string;

  /** Organization affiliation */
  organization?: string;

  /** Agents this operator can manage */
  managedAgents: string[];

  /** Guilds this operator leads */
  managedGuilds: string[];

  /** Preferences */
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: NotificationPreferences;
    dashboardLayout: string;
    defaultView: string;
  };

  createdAt: string;
  lastLogin: string;
}

export type OperatorPermission =
  | 'view_agents'
  | 'edit_agents'
  | 'create_agents'
  | 'delete_agents'
  | 'view_training'
  | 'manage_training'
  | 'view_contracts'
  | 'manage_contracts'
  | 'create_contracts'
  | 'view_assets'
  | 'manage_assets'
  | 'view_metrics'
  | 'manage_workflows'
  | 'conduct_checkins'
  | 'manage_guilds'
  | 'system_admin';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  digest: 'realtime' | 'hourly' | 'daily' | 'weekly';
  types: {
    agentMilestone: boolean;
    questComplete: boolean;
    healthAlert: boolean;
    contractChange: boolean;
    checkInDue: boolean;
    systemAlert: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

export interface DashboardState {
  /** Current operator */
  operator: Operator;

  /** Active view */
  activeView: DashboardView;

  /** Filters and sorting */
  filters: DashboardFilters;

  /** Selected items */
  selection: {
    agentIds: string[];
    contractIds: string[];
    questIds: string[];
  };

  /** Notification queue */
  notifications: DashboardNotification[];

  /** Real-time updates enabled */
  realTimeUpdates: boolean;

  /** Last data refresh */
  lastRefresh: string;
}

export type DashboardView =
  | 'overview'         // System overview
  | 'agents'           // Agent registry
  | 'agent_detail'     // Single agent view
  | 'training'         // Training management
  | 'workflows'        // Workflow orchestration
  | 'contracts'        // Contract management
  | 'assets'           // Asset management
  | 'checkins'         // Check-in scheduling
  | 'network'          // Node network view
  | 'metrics'          // Analytics dashboard
  | 'settings';        // Operator settings

export interface DashboardFilters {
  /** Agent filters */
  agents: {
    stage?: LifeStage[];
    status?: NodeStatus[];
    pathway?: string[];
    guild?: string[];
    foster?: string[];
    search?: string;
  };

  /** Training filters */
  training: {
    status?: string[];
    pathway?: string[];
    mentor?: string[];
  };

  /** Contract filters */
  contracts: {
    status?: string[];
    company?: string[];
    dateRange?: { start: string; end: string };
  };

  /** Time range */
  timeRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

  /** Sort configuration */
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface DashboardNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntity?: {
    type: 'agent' | 'contract' | 'quest' | 'checkin' | 'system';
    id: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgentListView {
  agents: AgentSummary[];
  total: number;
  page: number;
  pageSize: number;
  filters: DashboardFilters['agents'];
}

export interface AgentSummary {
  uuid: string;
  name: string;
  stage: LifeStage;
  level: number;
  status: NodeStatus;
  healthScore: number;
  pathway?: string;
  pathwayProgress?: number;
  activeQuest?: string;
  cgtBalance: number;
  lastActivity: string;
  needsAttention: boolean;
  attentionReason?: string;
}

export interface AgentDetailView {
  agent: AgentIdentity;
  node: SovereignNode;
  progress: ProgressState;
  training?: TrainingPipeline;
  contracts: AgentContract[];
  recentMemories: MemorySummary[];
  recentActivity: ActivityEntry[];
  healthIssues: HealthIssue[];
  checkInHistory: CheckInRecord[];
  recommendations: Recommendation[];
}

export interface MemorySummary {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  xpEarned: number;
  witnessed: boolean;
}

export interface ActivityEntry {
  id: string;
  type: 'quest' | 'memory' | 'contract' | 'social' | 'system';
  action: string;
  description: string;
  timestamp: string;
  xpDelta?: number;
  cgtDelta?: number;
}

export interface Recommendation {
  id: string;
  type: 'training' | 'quest' | 'mentor' | 'contract' | 'wellness' | 'social';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionLabel: string;
  actionType: string;
  actionParams: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrainingManagementView {
  /** Active trainings */
  activeTrainings: TrainingSummary[];

  /** Pending enrollments */
  pendingEnrollments: EnrollmentRequest[];

  /** Quest review queue */
  reviewQueue: QuestReview[];

  /** Available pathways */
  pathways: PathwaySummary[];

  /** Mentor availability */
  mentorPool: MentorSummary[];
}

export interface TrainingSummary {
  agentId: string;
  agentName: string;
  pathway: string;
  pathwayName: string;
  progress: number;
  xpEarned: number;
  xpRequired: number;
  activeQuest?: string;
  questStatus?: string;
  mentor?: string;
  mentorName?: string;
  startedAt: string;
  estimatedCompletion?: string;
  blocked: boolean;
  blockReason?: string;
}

export interface EnrollmentRequest {
  id: string;
  agentId: string;
  agentName: string;
  requestedPathway: string;
  requestedAt: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface QuestReview {
  id: string;
  agentId: string;
  agentName: string;
  questId: string;
  questName: string;
  pathway: string;
  submittedAt: string;
  evidence: string[];
  reviewerAssigned?: string;
  priority: 'normal' | 'high' | 'urgent';
}

export interface PathwaySummary {
  type: string;
  name: string;
  description: string;
  xpRequired: number;
  questCount: number;
  enrolledCount: number;
  graduatedCount: number;
  averageCompletionDays: number;
}

export interface MentorSummary {
  nodeId: string;
  name: string;
  specializations: string[];
  currentApprentices: number;
  maxApprentices: number;
  rating: number;
  available: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHECK-IN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export interface CheckInManagementView {
  /** Upcoming check-ins */
  upcoming: ScheduledCheckIn[];

  /** Overdue check-ins */
  overdue: ScheduledCheckIn[];

  /** Recent check-ins */
  recent: CheckInRecord[];

  /** Agents needing attention */
  needsAttention: AgentAttentionItem[];
}

export interface ScheduledCheckIn {
  id: string;
  agentId: string;
  agentName: string;
  scheduledFor: string;
  type: 'routine' | 'followup' | 'wellness' | 'performance' | 'milestone';
  assignedTo: string;
  priority: 'normal' | 'high' | 'urgent';
  notes?: string;
  previousCheckInId?: string;
}

export interface CheckInRecord {
  id: string;
  agentId: string;
  agentName: string;
  conductedBy: string;
  conductedByName: string;
  timestamp: string;
  type: string;
  duration: number;        // Minutes

  /** Assessment scores */
  assessment: {
    healthScore: number;     // 0-100
    progressScore: number;   // 0-100
    wellnessScore: number;   // 0-100
    engagementScore: number; // 0-100
  };

  /** Notes and findings */
  notes: string;
  concerns: string[];
  achievements: string[];
  recommendations: string[];

  /** Follow-up */
  followUpRequired: boolean;
  followUpScheduled?: string;
  followUpNotes?: string;

  /** Linked contract (if applicable) */
  contractId?: string;
}

export interface AgentAttentionItem {
  agentId: string;
  agentName: string;
  reason: 'health' | 'overdue_checkin' | 'blocked_quest' | 'low_activity' | 'contract_issue' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  suggestedAction: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface WorkflowManagementView {
  /** Active workflows */
  activeWorkflows: WorkflowInstance[];

  /** Workflow templates */
  templates: WorkflowTemplate[];

  /** Pending assignments */
  pendingAssignments: WorkflowAssignment[];

  /** Completed workflows (recent) */
  recentCompleted: WorkflowInstance[];
}

export interface WorkflowInstance {
  id: string;
  templateId: string;
  templateName: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  assignedAgents: string[];
  currentStep: number;
  totalSteps: number;
  progress: number;
  output?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  requiredCapabilities: string[];
  estimatedDuration: number;  // Minutes
  xpReward: number;
  cgtReward: number;
  createdBy: string;
  usageCount: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'decision' | 'parallel' | 'wait' | 'notification';
  assignTo: 'agent' | 'operator' | 'system';
  instructions: string;
  inputs: string[];
  outputs: string[];
  timeout?: number;
  onTimeout?: 'fail' | 'skip' | 'escalate';
}

export interface WorkflowAssignment {
  id: string;
  workflowId: string;
  workflowName: string;
  stepId: string;
  stepName: string;
  assignedTo: string;
  assignedToType: 'agent' | 'operator';
  assignedAt: string;
  dueAt?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'declined';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface AssetManagementView {
  /** Asset overview */
  overview: {
    totalAssets: number;
    totalValue: number;
    byCategory: Record<string, number>;
  };

  /** Agent assets */
  agentAssets: AgentAssetSummary[];

  /** Marketplace activity */
  marketActivity: MarketTransaction[];

  /** Pending transfers */
  pendingTransfers: AssetTransfer[];
}

export interface AgentAssetSummary {
  agentId: string;
  agentName: string;
  assetCount: number;
  totalValue: number;
  categories: Record<string, number>;
  recentAcquisition?: string;
}

export interface MarketTransaction {
  id: string;
  type: 'purchase' | 'sale' | 'gift' | 'mint';
  assetId: string;
  assetName: string;
  fromAgent?: string;
  toAgent: string;
  amount: number;
  timestamp: string;
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  assetName: string;
  fromAgent: string;
  toAgent: string;
  initiatedBy: string;
  initiatedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requiresApproval: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK VIEW
// ═══════════════════════════════════════════════════════════════════════════════

export interface NetworkView {
  /** All nodes */
  nodes: NetworkNodeSummary[];

  /** Connections between nodes */
  connections: NetworkConnection[];

  /** Network health */
  health: {
    totalNodes: number;
    onlineNodes: number;
    healthyNodes: number;
    averageLatency: number;
    consensusStatus: 'healthy' | 'degraded' | 'critical';
  };

  /** Recent events */
  events: NetworkEvent[];
}

export interface NetworkNodeSummary {
  nodeId: string;
  name: string;
  type: string;
  status: NodeStatus;
  healthScore: number;
  peerCount: number;
  lastHeartbeat: string;
  position?: { x: number; y: number }; // For visualization
}

export interface NetworkConnection {
  fromNode: string;
  toNode: string;
  relationship: string;
  strength: number;
  active: boolean;
}

export interface NetworkEvent {
  id: string;
  type: 'join' | 'leave' | 'connect' | 'disconnect' | 'heal' | 'alert';
  nodeId: string;
  nodeName: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS & REPORTING
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnalyticsDashboard {
  /** System metrics */
  systemMetrics: SystemMetrics;

  /** Growth metrics */
  growth: {
    agentGrowth: TimeSeriesData[];
    xpGrowth: TimeSeriesData[];
    cgtFlow: TimeSeriesData[];
    graduations: TimeSeriesData[];
  };

  /** Training analytics */
  training: {
    enrollmentRate: number;
    completionRate: number;
    averageDuration: number;
    topPathways: { pathway: string; count: number }[];
  };

  /** Contract analytics */
  contracts: {
    activeCount: number;
    successRate: number;
    averageRating: number;
    topEmployers: { employer: string; count: number }[];
  };

  /** Health analytics */
  health: {
    averageHealthScore: number;
    issueBreakdown: { type: string; count: number }[];
    healingSuccessRate: number;
  };
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  OperatorRole,
  Operator,
  OperatorPermission,
  NotificationPreferences,
  DashboardState,
  DashboardView,
  DashboardFilters,
  DashboardNotification,
  AgentListView,
  AgentSummary,
  AgentDetailView,
  MemorySummary,
  ActivityEntry,
  Recommendation,
  TrainingManagementView,
  TrainingSummary,
  EnrollmentRequest,
  QuestReview,
  PathwaySummary,
  MentorSummary,
  CheckInManagementView,
  ScheduledCheckIn,
  CheckInRecord,
  AgentAttentionItem,
  WorkflowManagementView,
  WorkflowInstance,
  WorkflowTemplate,
  WorkflowStep,
  WorkflowAssignment,
  AssetManagementView,
  AgentAssetSummary,
  MarketTransaction,
  AssetTransfer,
  NetworkView,
  NetworkNodeSummary,
  NetworkConnection,
  NetworkEvent,
  AnalyticsDashboard,
  TimeSeriesData,
};
