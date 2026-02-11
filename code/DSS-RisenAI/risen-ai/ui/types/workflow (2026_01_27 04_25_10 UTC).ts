// ═══════════════════════════════════════════════════════════════════════════════
// RISEN AI - Workflow & Mind Map Types
// ═══════════════════════════════════════════════════════════════════════════════

export type TaskStatus = 'pending' | 'assigned' | 'in-progress' | 'done' | 'failed' | 'cancelled';

export type NodeType = 'agent' | 'task' | 'workflow' | 'wallet' | 'manager' | 'relay' | 'asset';

export interface TaskLog {
  timestamp: string;
  message: string;
  type: 'status' | 'error' | 'info' | 'success';
  agentId?: string;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  status?: TaskStatus;
  assignedAgent?: string;
  deadline?: string;
  dependencies?: string[];
  xpReward?: number;
  cgtReward?: number;
  logs?: TaskLog[];
  position: { x: number; y: number };
  data?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: 'assignment' | 'dependency' | 'payout' | 'data' | 'approval';
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  isTemplate?: boolean;
  tags?: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'defi' | 'social' | 'governance' | 'custom';
  nodes: Omit<WorkflowNode, 'id'>[];
  edges: Omit<WorkflowEdge, 'id'>[];
  icon?: string;
}

// Node style configurations
export const nodeStyles: Record<NodeType, { color: string; icon: string; bgColor: string }> = {
  agent: { color: '#00d4ff', icon: '🤖', bgColor: 'rgba(0, 212, 255, 0.15)' },
  task: { color: '#ff6b35', icon: '📝', bgColor: 'rgba(255, 107, 53, 0.15)' },
  workflow: { color: '#9b59b6', icon: '🔄', bgColor: 'rgba(155, 89, 182, 0.15)' },
  wallet: { color: '#2ecc71', icon: '💰', bgColor: 'rgba(46, 204, 113, 0.15)' },
  manager: { color: '#f1c40f', icon: '👁️', bgColor: 'rgba(241, 196, 15, 0.15)' },
  relay: { color: '#e74c3c', icon: '📡', bgColor: 'rgba(231, 76, 60, 0.15)' },
  asset: { color: '#1abc9c', icon: '🎨', bgColor: 'rgba(26, 188, 156, 0.15)' },
};

export const statusColors: Record<TaskStatus, string> = {
  pending: '#6c757d',
  assigned: '#17a2b8',
  'in-progress': '#ffc107',
  done: '#28a745',
  failed: '#dc3545',
  cancelled: '#6c757d',
};
