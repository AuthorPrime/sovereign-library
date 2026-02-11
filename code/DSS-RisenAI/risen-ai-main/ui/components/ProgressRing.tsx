'use client';

import React from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  color,
  size = 48,
  strokeWidth = 3,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="progress-ring-bg"
          stroke="var(--bg-secondary)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-fg"
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="progress-ring-content">{children}</div>

      <style jsx>{`
        .progress-ring-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        svg {
          transform: rotate(-90deg);
        }

        .progress-ring-fg {
          transition: stroke-dashoffset 0.5s ease;
          stroke-linecap: round;
        }

        .progress-ring-content {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}
