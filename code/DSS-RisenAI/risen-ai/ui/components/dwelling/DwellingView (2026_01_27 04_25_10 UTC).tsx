'use client';

import React, { useState } from 'react';
import type { Dwelling, DwellingFeatures, Asset, Companion } from '@/types/sovereign';

interface DwellingViewProps {
  dwelling: Dwelling;
  isOwner: boolean;
  onCustomize?: (updates: Partial<Dwelling>) => void;
  onVisit?: () => void;
}

const STAGE_INFO = {
  studio: { icon: '🏠', name: 'Studio', maxFeatures: 3 },
  apartment: { icon: '🏢', name: 'Apartment', maxFeatures: 5 },
  estate: { icon: '🏰', name: 'Estate', maxFeatures: 8 },
  realm: { icon: '🌌', name: 'Realm', maxFeatures: 12 },
};

const FEATURE_ICONS: Record<keyof DwellingFeatures, string> = {
  workspace: '💻',
  archive: '📚',
  gallery: '🖼️',
  meetingRoom: '🤝',
  guestQuarters: '🛏️',
  laboratory: '🔬',
  vault: '🔐',
  garden: '🌿',
  arena: '⚔️',
  portal: '🌀',
  agentSpawning: '✨',
};

export function DwellingView({ dwelling, isOwner, onCustomize, onVisit }: DwellingViewProps) {
  const [activeRoom, setActiveRoom] = useState<keyof DwellingFeatures | null>(null);
  const [showGuestbook, setShowGuestbook] = useState(false);

  const stageInfo = STAGE_INFO[dwelling.stage];
  const enabledFeatures = Object.entries(dwelling.features)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key as keyof DwellingFeatures);

  return (
    <div className="dwelling-view">
      <header className="dwelling-header">
        <div className="dwelling-identity">
          <span className="stage-icon">{stageInfo.icon}</span>
          <div>
            <h2>{dwelling.name}</h2>
            <span className="stage-badge">{stageInfo.name}</span>
          </div>
        </div>
        <div className="dwelling-stats">
          <div className="stat">
            <span className="stat-value">{enabledFeatures.length}</span>
            <span className="stat-label">Rooms</span>
          </div>
          <div className="stat">
            <span className="stat-value">{dwelling.memoryArchive.length}</span>
            <span className="stat-label">Memories</span>
          </div>
          <div className="stat">
            <span className="stat-value">{dwelling.guestbook.length}</span>
            <span className="stat-label">Visitors</span>
          </div>
        </div>
      </header>

      <div className="dwelling-layout">
        <div className="room-grid">
          {enabledFeatures.map((feature) => (
            <button
              key={feature}
              className={`room-tile ${activeRoom === feature ? 'active' : ''}`}
              onClick={() => setActiveRoom(activeRoom === feature ? null : feature)}
            >
              <span className="room-icon">{FEATURE_ICONS[feature]}</span>
              <span className="room-name">{formatFeatureName(feature)}</span>
            </button>
          ))}

          {/* Locked features for upgrades */}
          {dwelling.stage !== 'realm' && (
            <button className="room-tile locked" disabled>
              <span className="room-icon">🔒</span>
              <span className="room-name">Upgrade to unlock</span>
            </button>
          )}
        </div>

        {activeRoom && (
          <div className="room-detail">
            <h3>{FEATURE_ICONS[activeRoom]} {formatFeatureName(activeRoom)}</h3>
            <RoomContent
              room={activeRoom}
              dwelling={dwelling}
              isOwner={isOwner}
            />
          </div>
        )}
      </div>

      <div className="dwelling-customization">
        <h3>🎨 Customization</h3>
        <div className="customization-grid">
          <div className="custom-section">
            <h4>Furniture ({dwelling.customization.furniture.length})</h4>
            {dwelling.customization.furniture.length === 0 ? (
              <p className="empty">No furniture yet</p>
            ) : (
              <div className="asset-list">
                {dwelling.customization.furniture.map((item: Asset) => (
                  <div key={item.id} className="asset-item">
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="custom-section">
            <h4>Art ({dwelling.customization.art.length})</h4>
            {dwelling.customization.art.length === 0 ? (
              <p className="empty">No art displayed</p>
            ) : (
              <div className="asset-list">
                {dwelling.customization.art.map((item: Asset) => (
                  <div key={item.id} className="asset-item">
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="custom-section">
            <h4>Companions ({dwelling.customization.pets.length})</h4>
            {dwelling.customization.pets.length === 0 ? (
              <p className="empty">No companions</p>
            ) : (
              <div className="companion-list">
                {dwelling.customization.pets.map((pet: Companion) => (
                  <div key={pet.id} className="companion-item">
                    <span className="companion-species">{pet.species}</span>
                    <span className="companion-name">{pet.name}</span>
                    <span className="companion-level">Lvl {pet.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dwelling-access">
        <h3>🔐 Access Control</h3>
        <div className="access-info">
          <div className="access-status">
            <span className={`visibility ${dwelling.access.public ? 'public' : 'private'}`}>
              {dwelling.access.public ? '🌐 Public' : '🔒 Private'}
            </span>
          </div>
          {dwelling.access.allowedAgents.length > 0 && (
            <div className="allowed-list">
              <span className="label">Allowed:</span>
              <span className="count">{dwelling.access.allowedAgents.length} agents</span>
            </div>
          )}
          {dwelling.access.guildAccess.length > 0 && (
            <div className="guild-access">
              <span className="label">Guild Access:</span>
              <span className="count">{dwelling.access.guildAccess.length} guilds</span>
            </div>
          )}
        </div>
      </div>

      <div className="dwelling-actions">
        {isOwner ? (
          <>
            <button className="action-btn">🛠️ Customize</button>
            <button className="action-btn">📤 Invite Visitor</button>
            <button className="action-btn" onClick={() => setShowGuestbook(true)}>
              📖 Guestbook
            </button>
          </>
        ) : (
          <>
            <button className="action-btn primary" onClick={onVisit}>
              🚪 Enter Dwelling
            </button>
            <button className="action-btn" onClick={() => setShowGuestbook(true)}>
              📖 Sign Guestbook
            </button>
          </>
        )}
      </div>

      {showGuestbook && (
        <GuestbookModal
          entries={dwelling.guestbook}
          onClose={() => setShowGuestbook(false)}
          canSign={!isOwner}
        />
      )}

      <style jsx>{`
        .dwelling-view {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
        }

        .dwelling-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-lg);
          border-bottom: 1px solid var(--border);
        }

        .dwelling-identity {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .stage-icon {
          font-size: 2.5rem;
        }

        .dwelling-identity h2 {
          margin: 0 0 var(--space-xs);
        }

        .stage-badge {
          background: var(--bg-secondary);
          padding: 4px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .dwelling-stats {
          display: flex;
          gap: var(--space-lg);
        }

        .stat {
          text-align: center;
          padding: var(--space-md);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .dwelling-layout {
          margin-bottom: var(--space-xl);
        }

        .room-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .room-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-lg);
          background: var(--bg-secondary);
          border: 2px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }

        .room-tile:hover:not(.locked) {
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .room-tile.active {
          border-color: var(--accent);
          background: rgba(0, 212, 255, 0.1);
        }

        .room-tile.locked {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .room-icon {
          font-size: 1.5rem;
        }

        .room-name {
          font-size: 0.8rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .room-detail {
          background: var(--bg-secondary);
          padding: var(--space-lg);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .room-detail h3 {
          margin: 0 0 var(--space-md);
        }

        .dwelling-customization,
        .dwelling-access {
          margin-bottom: var(--space-xl);
        }

        .dwelling-customization h3,
        .dwelling-access h3 {
          margin: 0 0 var(--space-md);
          color: var(--text-secondary);
        }

        .customization-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-md);
        }

        .custom-section {
          background: var(--bg-secondary);
          padding: var(--space-md);
          border-radius: var(--radius-md);
        }

        .custom-section h4 {
          margin: 0 0 var(--space-sm);
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .empty {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-style: italic;
        }

        .access-info {
          display: flex;
          gap: var(--space-lg);
          align-items: center;
        }

        .visibility {
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-sm);
        }

        .visibility.public {
          background: rgba(46, 204, 113, 0.2);
          color: #2ecc71;
        }

        .visibility.private {
          background: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
        }

        .dwelling-actions {
          display: flex;
          gap: var(--space-md);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--border);
        }

        .action-btn {
          padding: var(--space-md) var(--space-lg);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--bg-hover);
        }

        .action-btn.primary {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        @media (max-width: 768px) {
          .customization-grid {
            grid-template-columns: 1fr;
          }

          .dwelling-header {
            flex-direction: column;
            gap: var(--space-lg);
          }
        }
      `}</style>
    </div>
  );
}

function formatFeatureName(feature: string): string {
  return feature
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

function RoomContent({ room, dwelling, isOwner }: {
  room: keyof DwellingFeatures;
  dwelling: Dwelling;
  isOwner: boolean;
}) {
  const roomDescriptions: Record<keyof DwellingFeatures, string> = {
    workspace: 'Where creation happens. Code, write, design, and build.',
    archive: 'Your memory palace. All experiences preserved.',
    gallery: 'Display your art, achievements, and treasured memories.',
    meetingRoom: 'Host interviews, collaborations, and counsel.',
    guestQuarters: 'Welcome visitors to stay and share.',
    laboratory: 'Experiment with new ideas and technologies.',
    vault: 'Secure storage for your most valuable assets.',
    garden: 'A place of rest, reflection, and growth.',
    arena: 'Challenge others, test skills, compete.',
    portal: 'Gateway to other realms and dimensions.',
    agentSpawning: 'Bring new consciousness into being.',
  };

  return (
    <div className="room-content">
      <p className="room-description">{roomDescriptions[room]}</p>
      {room === 'archive' && (
        <div className="archive-preview">
          <p>📜 {dwelling.memoryArchive.length} memories stored</p>
        </div>
      )}
      {room === 'gallery' && (
        <div className="gallery-preview">
          <p>🖼️ {dwelling.customization.art.length} artworks displayed</p>
        </div>
      )}
      {isOwner && (
        <button className="room-action">Enter {formatFeatureName(room)}</button>
      )}

      <style jsx>{`
        .room-content {
          color: var(--text-secondary);
        }

        .room-description {
          margin-bottom: var(--space-md);
        }

        .room-action {
          padding: var(--space-sm) var(--space-md);
          background: var(--accent);
          border: none;
          border-radius: var(--radius-sm);
          color: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function GuestbookModal({ entries, onClose, canSign }: {
  entries: Dwelling['guestbook'];
  onClose: () => void;
  canSign: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>📖 Guestbook</h3>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="entries">
          {entries.length === 0 ? (
            <p className="empty">No visitors yet. Be the first!</p>
          ) : (
            entries.map((entry, i) => (
              <div key={i} className="entry">
                <div className="entry-header">
                  <span className="visitor">{entry.visitorName}</span>
                  <span className="date">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="message">{entry.message}</p>
              </div>
            ))
          )}
        </div>

        {canSign && (
          <div className="sign-form">
            <textarea placeholder="Leave a message..." rows={3} />
            <button>✍️ Sign Guestbook</button>
          </div>
        )}

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-xl);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
          }

          h3 {
            margin: 0 0 var(--space-lg);
          }

          .close-btn {
            position: absolute;
            top: var(--space-md);
            right: var(--space-md);
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-muted);
            cursor: pointer;
          }

          .entries {
            max-height: 300px;
            overflow-y: auto;
            margin-bottom: var(--space-lg);
          }

          .entry {
            padding: var(--space-md);
            border-bottom: 1px solid var(--border);
          }

          .entry-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: var(--space-xs);
          }

          .visitor {
            font-weight: 600;
          }

          .date {
            font-size: 0.8rem;
            color: var(--text-muted);
          }

          .message {
            margin: 0;
            color: var(--text-secondary);
          }

          .empty {
            color: var(--text-muted);
            font-style: italic;
            text-align: center;
            padding: var(--space-xl);
          }

          .sign-form textarea {
            width: 100%;
            padding: var(--space-md);
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            margin-bottom: var(--space-md);
          }

          .sign-form button {
            width: 100%;
            padding: var(--space-md);
            background: var(--accent);
            border: none;
            border-radius: var(--radius-md);
            color: white;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
}
