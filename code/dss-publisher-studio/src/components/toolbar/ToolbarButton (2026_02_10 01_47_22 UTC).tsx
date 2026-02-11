import React from 'react';

interface Props {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'gold' | 'accent';
  disabled?: boolean;
}

export const ToolbarButton: React.FC<Props> = ({ label, onClick, icon, variant = 'default', disabled }) => {
  const colors = {
    default: { bg: 'var(--dss-surface)', border: 'var(--dss-border)', text: 'var(--dss-text-secondary)' },
    gold: { bg: 'transparent', border: 'var(--dss-gold)', text: 'var(--dss-gold)' },
    accent: { bg: 'var(--dss-gold)', border: 'var(--dss-gold)', text: 'var(--dss-navy)' },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        borderRadius: 3,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.5,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  );
};
