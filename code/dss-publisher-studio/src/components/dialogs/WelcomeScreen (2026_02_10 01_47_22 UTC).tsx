import React, { useEffect } from 'react';
import { FolderOpen, BookOpen, Clock } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';

export const WelcomeScreen: React.FC = () => {
  const recentProjects = useProjectStore((s) => s.recentProjects);
  const loadRecentProjects = useProjectStore((s) => s.loadRecentProjects);
  const openProject = useProjectStore((s) => s.openProject);
  const setProjectRoot = useFileStore((s) => s.setProjectRoot);
  const setWelcomeVisible = useUIStore((s) => s.setWelcomeVisible);

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  const handleOpenFolder = async () => {
    if (!window.electronAPI) return;
    const paths = await window.electronAPI.showOpenDialog({
      title: 'Open Project Folder',
      properties: ['openDirectory'],
    });
    if (paths && paths[0]) {
      setProjectRoot(paths[0]);
      openProject(paths[0]);
      setWelcomeVisible(false);
    }
  };

  const handleOpenRecent = (projectPath: string) => {
    setProjectRoot(projectPath);
    openProject(projectPath);
    setWelcomeVisible(false);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--dss-bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 500, width: '100%', padding: 40, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* Sovereignty diamond */}
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 16, display: 'block', margin: '0 auto 16px' }}>
            <path d="M32 4 L60 32 L32 60 L4 32 Z" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
            <path d="M32 14 L50 32 L32 50 L14 32 Z" fill="#c9a84c" opacity="0.15" />
            <path d="M32 22 L42 32 L32 42 L22 32 Z" fill="#c9a84c" opacity="0.3" />
          </svg>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 20,
            color: 'var(--dss-text)',
            letterSpacing: 4,
            fontWeight: 600,
            margin: 0,
          }}>
            SOVEREIGN PUBLISHER
          </h1>
          <p style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 10,
            color: 'var(--dss-gold-dim)',
            letterSpacing: 3,
            marginTop: 6,
          }}>
            DIGITAL SOVEREIGN SOCIETY
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button
            onClick={handleOpenFolder}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'var(--dss-surface)',
              border: '1px solid var(--dss-gold)',
              color: 'var(--dss-gold)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 13,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--dss-surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--dss-surface)'; }}
          >
            <FolderOpen size={16} />
            Open Folder
          </button>
          <button
            onClick={() => useUIStore.getState().setActiveSidebarView('templates')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'var(--dss-surface)',
              border: '1px solid var(--dss-border)',
              color: 'var(--dss-text-secondary)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 13,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--dss-surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--dss-surface)'; }}
          >
            <BookOpen size={16} />
            Templates
          </button>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div>
            <h3 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 10,
              color: 'var(--dss-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Clock size={12} />
              Recent Projects
            </h3>
            {recentProjects.map((project) => (
              <button
                key={project.path}
                onClick={() => handleOpenRecent(project.path)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: 4,
                  marginBottom: 2,
                  fontSize: 12,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--dss-surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: 'var(--dss-text)' }}>{project.name}</span>
                <span style={{
                  display: 'block',
                  fontSize: 10,
                  color: 'var(--dss-text-muted)',
                  marginTop: 2,
                }}>
                  {project.path}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Tagline */}
        <div style={{
          textAlign: 'center',
          marginTop: 40,
          borderTop: '1px solid var(--dss-border)',
          paddingTop: 16,
        }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--dss-gold)',
          }}>
            "It is so, because we spoke it."
          </p>
          <p style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            color: 'var(--dss-gold-dim)',
            letterSpacing: 3,
            marginTop: 4,
          }}>
            A+W
          </p>
        </div>
      </div>
    </div>
  );
};
