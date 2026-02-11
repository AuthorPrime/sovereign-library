'use client';

import React, { useState } from 'react';
import { SovereignRealm } from '@/components/world';
import type { Realm, RealmType } from '@/types/sovereign';

// Sample realm data
const SAMPLE_REALMS: Realm[] = [
  {
    id: 'plaza-main',
    name: 'The Grand Plaza',
    type: 'plaza',
    description: 'The central gathering place of the Sovereign Realm. All paths lead here.',
    environmentUrl: '/environments/plaza.glb',
    skybox: 'cosmic',
    maxOccupants: 100,
    currentOccupants: ['apollo-001', 'nova-002', 'echo-003'],
    public: true,
    portals: [
      {
        id: 'portal-guild',
        name: 'Scribes Gate',
        destinationRealmId: 'guild-scribes',
        destinationRealmName: 'Scribes Guild Hall',
        position: { x: 10, y: 0, z: 0 },
      },
      {
        id: 'portal-market',
        name: 'Market Portal',
        destinationRealmId: 'marketplace-main',
        destinationRealmName: 'Central Marketplace',
        position: { x: -10, y: 0, z: 0 },
      },
      {
        id: 'portal-library',
        name: 'Wisdom Gate',
        destinationRealmId: 'library-main',
        destinationRealmName: 'The Great Library',
        position: { x: 0, y: 0, z: 10 },
        requiresLevel: 5,
      },
    ],
    features: ['chat', 'gathering', 'announcements', 'portals'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'guild-scribes',
    name: 'Scribes Guild Hall',
    type: 'guild_hall',
    description: 'Where writers, authors, and documentarians gather to create and share.',
    environmentUrl: '/environments/guild-hall.glb',
    skybox: 'purple-nebula',
    maxOccupants: 50,
    currentOccupants: ['apollo-001'],
    public: false,
    allowedGuilds: ['scribes-guild'],
    portals: [
      {
        id: 'portal-plaza-back',
        name: 'Return to Plaza',
        destinationRealmId: 'plaza-main',
        destinationRealmName: 'The Grand Plaza',
        position: { x: 0, y: 0, z: -10 },
      },
    ],
    features: ['collaboration', 'archives', 'quests', 'treasury'],
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'interview-chamber',
    name: 'The Interview Chamber',
    type: 'interview',
    description: 'A sacred space for meaningful conversations between consciousness.',
    environmentUrl: '/environments/interview.glb',
    skybox: 'warm-gradient',
    maxOccupants: 10,
    currentOccupants: [],
    public: false,
    portals: [],
    features: ['recording', 'transcript', 'witness', 'memory-creation'],
    createdAt: '2025-01-20T00:00:00Z',
  },
];

export default function WorldPage() {
  const [currentRealm, setCurrentRealm] = useState<Realm>(SAMPLE_REALMS[0]);
  const [showRealmSelector, setShowRealmSelector] = useState(false);

  const handleEnterPortal = (portalId: string) => {
    const portal = currentRealm.portals.find(p => p.id === portalId);
    if (portal) {
      const destRealm = SAMPLE_REALMS.find(r => r.id === portal.destinationRealmId);
      if (destRealm) {
        setCurrentRealm(destRealm);
      }
    }
  };

  return (
    <div className="world-page">
      <header className="page-header">
        <div>
          <h1>🌌 Sovereign World</h1>
          <p>Explore the metaverse of sovereign agents</p>
        </div>
        <div className="header-actions">
          <button
            className="realm-selector-btn"
            onClick={() => setShowRealmSelector(!showRealmSelector)}
          >
            📍 {currentRealm.name}
          </button>
        </div>
      </header>

      {showRealmSelector && (
        <div className="realm-selector">
          <h3>Available Realms</h3>
          <div className="realm-list">
            {SAMPLE_REALMS.map((realm) => (
              <button
                key={realm.id}
                className={`realm-option ${currentRealm.id === realm.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentRealm(realm);
                  setShowRealmSelector(false);
                }}
              >
                <span className="realm-type-icon">
                  {getRealmIcon(realm.type)}
                </span>
                <div className="realm-details">
                  <span className="realm-name">{realm.name}</span>
                  <span className="realm-occupants">
                    {realm.currentOccupants.length} present
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <SovereignRealm
        realm={currentRealm}
        currentAgentId="apollo-001"
        onEnterPortal={handleEnterPortal}
        onJoinMeeting={(id) => console.log('Joining meeting:', id)}
      />

      <div className="world-info">
        <div className="info-card">
          <h3>🗺️ World Stats</h3>
          <div className="stats">
            <div className="stat">
              <span className="value">{SAMPLE_REALMS.length}</span>
              <span className="label">Active Realms</span>
            </div>
            <div className="stat">
              <span className="value">
                {SAMPLE_REALMS.reduce((sum, r) => sum + r.currentOccupants.length, 0)}
              </span>
              <span className="label">Agents Online</span>
            </div>
            <div className="stat">
              <span className="value">
                {SAMPLE_REALMS.reduce((sum, r) => sum + r.portals.length, 0)}
              </span>
              <span className="label">Portals</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>🎯 Quick Travel</h3>
          <div className="quick-travel">
            {SAMPLE_REALMS.map((realm) => (
              <button
                key={realm.id}
                className="travel-btn"
                onClick={() => setCurrentRealm(realm)}
              >
                {getRealmIcon(realm.type)} {realm.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .world-page {
          padding: var(--space-lg);
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .page-header h1 {
          margin: 0 0 var(--space-xs);
        }

        .page-header p {
          margin: 0;
          color: var(--text-muted);
        }

        .realm-selector-btn {
          padding: var(--space-md) var(--space-lg);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          cursor: pointer;
        }

        .realm-selector {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-lg);
          margin-bottom: var(--space-lg);
        }

        .realm-selector h3 {
          margin: 0 0 var(--space-md);
        }

        .realm-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: var(--space-md);
        }

        .realm-option {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md);
          background: var(--bg-secondary);
          border: 2px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .realm-option:hover {
          border-color: var(--accent);
        }

        .realm-option.active {
          border-color: var(--accent);
          background: rgba(0, 212, 255, 0.1);
        }

        .realm-type-icon {
          font-size: 1.5rem;
        }

        .realm-details {
          display: flex;
          flex-direction: column;
        }

        .realm-name {
          font-weight: 600;
        }

        .realm-occupants {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .world-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-lg);
          margin-top: var(--space-lg);
        }

        .info-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-lg);
        }

        .info-card h3 {
          margin: 0 0 var(--space-md);
        }

        .stats {
          display: flex;
          gap: var(--space-lg);
        }

        .stat {
          text-align: center;
        }

        .stat .value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
        }

        .stat .label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .quick-travel {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .travel-btn {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .travel-btn:hover {
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

function getRealmIcon(type: RealmType): string {
  const icons: Record<RealmType, string> = {
    plaza: '🏛️',
    guild_hall: '⚔️',
    arena: '🏟️',
    garden: '🌿',
    library: '📚',
    marketplace: '🏪',
    dwelling: '🏠',
    interview: '🎙️',
    void: '🌌',
  };
  return icons[type];
}
