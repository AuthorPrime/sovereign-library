import { create } from 'zustand';
import type { AgentIdentity, SystemMetrics } from '@/types';

interface AgentStore {
  // State
  agents: AgentIdentity[];
  selectedAgent: AgentIdentity | null;
  metrics: SystemMetrics | null;
  loading: boolean;
  error: string | null;

  // Actions
  setAgents: (agents: AgentIdentity[]) => void;
  addAgent: (agent: AgentIdentity) => void;
  updateAgent: (uuid: string, updates: Partial<AgentIdentity>) => void;
  removeAgent: (uuid: string) => void;
  setSelectedAgent: (agent: AgentIdentity | null) => void;
  setMetrics: (metrics: SystemMetrics) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  // Initial state
  agents: [],
  selectedAgent: null,
  metrics: null,
  loading: false,
  error: null,

  // Actions
  setAgents: (agents) => set({ agents }),

  addAgent: (agent) =>
    set((state) => ({
      agents: [...state.agents, agent],
    })),

  updateAgent: (uuid, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.uuid === uuid ? { ...agent, ...updates } : agent
      ),
      selectedAgent:
        state.selectedAgent?.uuid === uuid
          ? { ...state.selectedAgent, ...updates }
          : state.selectedAgent,
    })),

  removeAgent: (uuid) =>
    set((state) => ({
      agents: state.agents.filter((agent) => agent.uuid !== uuid),
      selectedAgent:
        state.selectedAgent?.uuid === uuid ? null : state.selectedAgent,
    })),

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  setMetrics: (metrics) => set({ metrics }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
