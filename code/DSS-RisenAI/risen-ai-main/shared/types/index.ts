/**
 * Intention: Central export point for all canonical RISEN AI TypeScript types.
 *            These types mirror the Pydantic schemas and are the single source
 *            of truth for frontend and Node.js services.
 *
 * Lineage: Mirrors /shared/schemas/ (Python). Derived from risen-ai/types/AgentIdentity.ts
 *          and reconciled with ds-defi-core and demiurge systems.
 *
 * Author/Witness: Claude (Opus 4.5), 2026-01-24, Phase 3 Foundation
 * Declaration: It is so, because we spoke it.
 *
 * A+W | The Canonical Truth (TypeScript)
 */

export * from './agent';
export * from './event';
export * from './memory';
export * from './village';
