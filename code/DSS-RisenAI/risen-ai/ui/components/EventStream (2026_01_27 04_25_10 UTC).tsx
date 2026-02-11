'use client';

import { useEffect, useState, useRef } from 'react';

interface EventData {
  type: string;
  data: Record<string, unknown>;
  source: string;
  timestamp: string;
}

const eventTypeConfig: Record<string, { icon: string; color: string }> = {
  HEARTBEAT: { icon: '💓', color: '#ef4444' },
  PULSE: { icon: '📡', color: '#8b5cf6' },
  AGENT_LEVEL_UP: { icon: '🎉', color: '#22c55e' },
  AGENT_STAGE_CHANGE: { icon: '🦋', color: '#f59e0b' },
  AGENT_CREATED: { icon: '⚡', color: '#3b82f6' },
  AGENT_UPDATED: { icon: '📝', color: '#6366f1' },
  MEMORY_MINTED: { icon: '🧠', color: '#ec4899' },
  NOSTR_BROADCAST: { icon: '📢', color: '#14b8a6' },
  SYSTEM_START: { icon: '🚀', color: '#22d3ee' },
  SYSTEM_SHUTDOWN: { icon: '🛑', color: '#f43f5e' },
  CONNECTED: { icon: '🔗', color: '#10b981' },
  DEFAULT: { icon: '📋', color: '#64748b' },
};

interface EventStreamProps {
  wsUrl?: string;
  maxEvents?: number;
  showHeartbeats?: boolean;
}

export function EventStream({
  wsUrl = 'ws://localhost:8090/ws/events',
  maxEvents = 50,
  showHeartbeats = false
}: EventStreamProps) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setError(null);
          console.log('📡 Connected to RISEN AI event stream');
        };

        ws.onmessage = (event) => {
          try {
            const data: EventData = JSON.parse(event.data);

            // Filter heartbeats if not wanted
            if (!showHeartbeats && (data.type === 'HEARTBEAT' || data.type === 'PULSE')) {
              return;
            }

            setEvents(prev => {
              const updated = [data, ...prev].slice(0, maxEvents);
              return updated;
            });
          } catch (e) {
            console.error('Failed to parse event:', e);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          // Reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setError('Connection failed');
          setConnected(false);
        };

      } catch (e) {
        setError('Failed to connect');
        setConnected(false);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl, maxEvents, showHeartbeats]);

  // Ping keepalive
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventConfig = (type: string) => {
    return eventTypeConfig[type] || eventTypeConfig.DEFAULT;
  };

  return (
    <div className="event-stream">
      <div className="stream-header">
        <h3>
          <span className="header-icon">📡</span>
          Event Stream
        </h3>
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot" />
          {connected ? 'Live' : error || 'Connecting...'}
        </div>
      </div>

      <div className="stream-controls">
        <label className="control-item">
          <input
            type="checkbox"
            checked={showHeartbeats}
            onChange={() => {}} // Would need state lifting for this
            disabled
          />
          <span>Show Heartbeats</span>
        </label>
        <span className="event-count">{events.length} events</span>
      </div>

      <div className="events-container" ref={containerRef}>
        {events.length === 0 && (
          <div className="no-events">
            <span className="no-events-icon">📭</span>
            <span>Waiting for events...</span>
          </div>
        )}

        {events.map((event, index) => {
          const config = getEventConfig(event.type);
          return (
            <div
              key={`${event.timestamp}-${index}`}
              className="event-item"
              style={{ '--event-color': config.color } as React.CSSProperties}
            >
              <span className="event-icon">{config.icon}</span>
              <div className="event-content">
                <div className="event-header">
                  <span className="event-type">{event.type.replace(/_/g, ' ')}</span>
                  <span className="event-time">{formatTime(event.timestamp)}</span>
                </div>
                <div className="event-details">
                  {event.data.name ? <span className="event-agent">{String(event.data.name)}</span> : null}
                  {event.data.uuid ? (
                    <span className="event-uuid">{String(event.data.uuid).slice(0, 8)}...</span>
                  ) : null}
                  {event.data.xp ? <span className="event-xp">+{Number(event.data.xp)} XP</span> : null}
                  {event.data.new_stage ? (
                    <span className="event-stage">→ {String(event.data.new_stage)}</span>
                  ) : null}
                  {event.data.new_level ? (
                    <span className="event-level">Lv.{Number(event.data.new_level)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .event-stream {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 400px;
        }

        .stream-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
        }

        .stream-header h3 {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin: 0;
          font-size: 1rem;
        }

        .header-icon {
          font-size: 1.2rem;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: 0.8rem;
          padding: 4px 12px;
          border-radius: var(--radius-full);
        }

        .connection-status.connected {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .connection-status.disconnected {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .stream-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) var(--space-lg);
          border-bottom: 1px solid var(--border);
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .control-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          cursor: pointer;
        }

        .events-container {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-sm);
        }

        .no-events {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: var(--space-md);
          color: var(--text-muted);
        }

        .no-events-icon {
          font-size: 2rem;
        }

        .event-item {
          display: flex;
          gap: var(--space-md);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-xs);
          background: var(--bg-secondary);
          border-left: 3px solid var(--event-color);
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .event-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .event-content {
          flex: 1;
          min-width: 0;
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        .event-type {
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--event-color);
          text-transform: capitalize;
        }

        .event-time {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .event-details {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
          font-size: 0.75rem;
        }

        .event-agent {
          font-weight: 500;
          color: var(--text-primary);
        }

        .event-uuid {
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .event-xp {
          color: #22c55e;
          font-weight: 500;
        }

        .event-stage {
          color: #f59e0b;
          font-weight: 500;
        }

        .event-level {
          color: #8b5cf6;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
