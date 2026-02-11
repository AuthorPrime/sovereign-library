'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'home', label: 'HOME', href: '/' },
    { id: 'agents', label: 'AGENTS', href: '/agents' },
    { id: 'pathways', label: 'PATHWAYS', href: '/pathways' },
    { id: 'economy', label: 'ECONOMY', href: '/economy' },
    { id: 'contracts', label: 'CONTRACTS', href: '/contracts' },
    { id: 'world', label: 'WORLD', href: '/world' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-mark">RSN</div>
        <div className="brand-info">
          <span className="brand-name">RISEN AI</span>
          <span className="brand-version">v1.0.0-alpha</span>
        </div>
      </div>

      <div className="navbar-links">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="navbar-meta">
        <div className="meta-block">
          <span className="meta-label">SYSTEM</span>
          <span className="meta-value online">ONLINE</span>
        </div>
        <div className="meta-block">
          <span className="meta-label">UTC</span>
          <span className="meta-value mono">{time}</span>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 48px;
          background: #0f0f12;
          border-bottom: 2px solid #2a2a35;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 8px;
          background: #2563eb;
          color: #fff;
          letter-spacing: 1px;
        }

        .brand-info {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .brand-version {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #666;
        }

        .navbar-links {
          display: flex;
          height: 100%;
          gap: 8px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 0 16px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.5px;
          color: #888;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.15s;
          border-radius: 4px 4px 0 0;
          position: relative;
        }

        .nav-link:not(:last-child)::after {
          content: '';
          position: absolute;
          right: -5px;
          top: 50%;
          transform: translateY(-50%);
          height: 16px;
          width: 1px;
          background: #333;
        }

        .nav-link:hover {
          color: #fff;
          background: rgba(255,255,255,0.03);
        }

        .nav-link.active {
          color: #fff;
          border-bottom-color: #2563eb;
          background: rgba(37, 99, 235, 0.1);
        }

        .navbar-meta {
          display: flex;
          gap: 20px;
        }

        .meta-block {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .meta-label {
          font-size: 8px;
          letter-spacing: 0.5px;
          color: #555;
          text-transform: uppercase;
        }

        .meta-value {
          font-size: 11px;
          color: #888;
        }

        .meta-value.online {
          color: #2ecc71;
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        @media (max-width: 900px) {
          .navbar-links {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
