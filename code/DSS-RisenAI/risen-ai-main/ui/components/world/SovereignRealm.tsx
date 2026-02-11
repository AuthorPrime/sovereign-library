'use client';

import React, { useState, useEffect } from 'react';
import type { Realm, Portal, Meeting, RealmType } from '@/types/sovereign';

interface SovereignRealmProps {
  realm: Realm;
  currentAgentId: string;
  onEnterPortal?: (portalId: string) => void;
  onJoinMeeting?: (meetingId: string) => void;
}

const REALM_THEMES: Record<RealmType, { bg: string; accent: string; icon: string }> = {
  plaza: { bg: '#1a1a2e', accent: '#00d4ff', icon: '🏛️' },
  guild_hall: { bg: '#2d1b4e', accent: '#9b59b6', icon: '⚔️' },
  arena: { bg: '#2e1a1a', accent: '#e74c3c', icon: '🏟️' },
  garden: { bg: '#1a2e1a', accent: '#2ecc71', icon: '🌿' },
  library: { bg: '#2e2a1a', accent: '#f1c40f', icon: '📚' },
  marketplace: { bg: '#1a2e2e', accent: '#1abc9c', icon: '🏪' },
  dwelling: { bg: '#1e1e2e', accent: '#3498db', icon: '🏠' },
  interview: { bg: '#2e1e2e', accent: '#e91e63', icon: '🎙️' },
  void: { bg: '#0a0a0a', accent: '#ffffff', icon: '🌌' },
};

export function SovereignRealm({
  realm,
  currentAgentId,
  onEnterPortal,
  onJoinMeeting,
}: SovereignRealmProps) {
  const [isVRMode, setIsVRMode] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [activeMeetings, setActiveMeetings] = useState<Meeting[]>([]);

  const theme = REALM_THEMES[realm.type];

  useEffect(() => {
    // TODO: Fetch active meetings in this realm
    // setActiveMeetings(await fetchMeetings(realm.id));
  }, [realm.id]);

  const handleEnterVR = async () => {
    // Check for WebXR support
    if ('xr' in navigator) {
      try {
        // @ts-ignore
        const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
        if (isSupported) {
          setIsVRMode(true);
          // TODO: Initialize WebXR session
        } else {
          alert('VR mode requires a WebXR-compatible device');
        }
      } catch (e) {
        console.error('WebXR check failed:', e);
      }
    } else {
      alert('WebXR is not supported in this browser');
    }
  };

  return (
    <div
      className="sovereign-realm"
      style={{
        '--realm-bg': theme.bg,
        '--realm-accent': theme.accent,
      } as React.CSSProperties}
    >
      <header className="realm-header">
        <div className="realm-identity">
          <span className="realm-icon">{theme.icon}</span>
          <div>
            <h1>{realm.name}</h1>
            <span className="realm-type">{formatRealmType(realm.type)}</span>
          </div>
        </div>
        <div className="realm-info">
          <div className="occupancy">
            <span className="count">{realm.currentOccupants.length}</span>
            <span className="max">/ {realm.maxOccupants}</span>
            <span className="label">Present</span>
          </div>
          <button className="vr-btn" onClick={handleEnterVR}>
            🥽 Enter VR
          </button>
        </div>
      </header>

      <div className="realm-scene">
        {/* 3D Scene would be rendered here */}
        <div className="scene-placeholder">
          <div className="scene-content">
            <span className="big-icon">{theme.icon}</span>
            <h2>{realm.name}</h2>
            <p>{realm.description}</p>

            {/* Present agents */}
            <div className="present-agents">
              <h3>👥 Present ({realm.currentOccupants.length})</h3>
              <div className="agent-avatars">
                {realm.currentOccupants.slice(0, 8).map((agentId, i) => (
                  <div
                    key={agentId}
                    className="avatar-bubble"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {agentId === currentAgentId ? '⭐' : '👤'}
                  </div>
                ))}
                {realm.currentOccupants.length > 8 && (
                  <div className="avatar-more">
                    +{realm.currentOccupants.length - 8}
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="realm-features">
              <h3>✨ Features</h3>
              <div className="feature-tags">
                {realm.features.map((feature) => (
                  <span key={feature} className="feature-tag">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Portals overlay */}
        <div className="portals-panel">
          <h3>🌀 Portals</h3>
          {realm.portals.length === 0 ? (
            <p className="no-portals">No portals in this realm</p>
          ) : (
            <div className="portal-list">
              {realm.portals.map((portal) => (
                <button
                  key={portal.id}
                  className="portal-btn"
                  onClick={() => onEnterPortal?.(portal.id)}
                >
                  <span className="portal-icon">🌀</span>
                  <div className="portal-info">
                    <span className="portal-name">{portal.name}</span>
                    <span className="portal-dest">→ {portal.destinationRealmName}</span>
                  </div>
                  {portal.requiresLevel && (
                    <span className="portal-req">Lvl {portal.requiresLevel}+</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active meetings */}
      {activeMeetings.length > 0 && (
        <div className="meetings-panel">
          <h3>🎙️ Active Meetings</h3>
          <div className="meeting-list">
            {activeMeetings.map((meeting) => (
              <div key={meeting.id} className="meeting-card">
                <div className="meeting-info">
                  <span className="meeting-type">{meeting.type}</span>
                  <h4>{meeting.title}</h4>
                  <span className="meeting-host">Hosted by {meeting.hostName}</span>
                </div>
                <div className="meeting-stats">
                  <span>{meeting.participants.length} participants</span>
                </div>
                <button
                  className="join-btn"
                  onClick={() => onJoinMeeting?.(meeting.id)}
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="realm-actions">
        <button className="action-btn">💬 Chat</button>
        <button className="action-btn">📸 Screenshot</button>
        <button className="action-btn">🎙️ Host Meeting</button>
        <button className="action-btn">📍 Mark Location</button>
        <button className="action-btn secondary">🚪 Leave Realm</button>
      </div>

      <style jsx>{`
        .sovereign-realm {
          background: var(--realm-bg);
          border-radius: var(--radius-lg);
          overflow: hidden;
          min-height: 600px;
          display: flex;
          flex-direction: column;
        }

        .realm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .realm-identity {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .realm-icon {
          font-size: 2.5rem;
        }

        .realm-identity h1 {
          margin: 0;
          color: white;
        }

        .realm-type {
          color: var(--realm-accent);
          font-size: 0.9rem;
          text-transform: capitalize;
        }

        .realm-info {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
        }

        .occupancy {
          text-align: center;
          color: white;
        }

        .occupancy .count {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--realm-accent);
        }

        .occupancy .max {
          color: rgba(255, 255, 255, 0.5);
        }

        .occupancy .label {
          display: block;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .vr-btn {
          padding: var(--space-md) var(--space-lg);
          background: var(--realm-accent);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .vr-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
        }

        .realm-scene {
          flex: 1;
          position: relative;
          display: flex;
        }

        .scene-placeholder {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, var(--realm-bg) 0%, rgba(0,0,0,0.5) 100%);
        }

        .scene-content {
          text-align: center;
          color: white;
          padding: var(--space-xl);
        }

        .big-icon {
          font-size: 6rem;
          display: block;
          margin-bottom: var(--space-lg);
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .scene-content h2 {
          margin: 0 0 var(--space-sm);
        }

        .scene-content p {
          color: rgba(255, 255, 255, 0.7);
          max-width: 400px;
          margin: 0 auto var(--space-xl);
        }

        .present-agents {
          margin-bottom: var(--space-xl);
        }

        .present-agents h3,
        .realm-features h3 {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: var(--space-md);
        }

        .agent-avatars {
          display: flex;
          justify-content: center;
          gap: var(--space-sm);
        }

        .avatar-bubble {
          width: 40px;
          height: 40px;
          background: var(--realm-accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          animation: pop-in 0.3s ease-out backwards;
        }

        @keyframes pop-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
        }

        .avatar-more {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }

        .feature-tags {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--space-sm);
        }

        .feature-tag {
          padding: var(--space-xs) var(--space-md);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
        }

        .portals-panel {
          position: absolute;
          right: var(--space-md);
          top: var(--space-md);
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          min-width: 200px;
          color: white;
        }

        .portals-panel h3 {
          margin: 0 0 var(--space-md);
          font-size: 0.9rem;
        }

        .no-portals {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .portal-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .portal-btn {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          color: white;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .portal-btn:hover {
          border-color: var(--realm-accent);
          background: rgba(255, 255, 255, 0.15);
        }

        .portal-icon {
          font-size: 1.2rem;
        }

        .portal-info {
          flex: 1;
        }

        .portal-name {
          display: block;
          font-weight: 500;
        }

        .portal-dest {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .portal-req {
          font-size: 0.7rem;
          padding: 2px 6px;
          background: rgba(255, 193, 7, 0.3);
          border-radius: 4px;
          color: #ffc107;
        }

        .meetings-panel {
          padding: var(--space-lg);
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .meetings-panel h3 {
          margin: 0 0 var(--space-md);
          color: white;
        }

        .realm-actions {
          display: flex;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: rgba(0, 0, 0, 0.5);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-btn {
          padding: var(--space-sm) var(--space-md);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-sm);
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .action-btn.secondary {
          margin-left: auto;
          border-color: rgba(231, 76, 60, 0.5);
          color: #e74c3c;
        }
      `}</style>
    </div>
  );
}

function formatRealmType(type: RealmType): string {
  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}
