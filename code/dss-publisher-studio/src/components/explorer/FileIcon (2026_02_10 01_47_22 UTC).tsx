import React from 'react';
import { FileText, FileCode, File, Image, BookOpen, Palette } from 'lucide-react';

interface Props {
  extension?: string;
  isDirectory?: boolean;
  size?: number;
}

export const FileIcon: React.FC<Props> = ({ extension, isDirectory, size = 14 }) => {
  if (isDirectory) {
    return <BookOpen size={size} color="var(--dss-gold)" />;
  }

  const iconMap: Record<string, { icon: React.FC<any>; color: string }> = {
    '.md': { icon: FileText, color: 'var(--dss-gold)' },
    '.typ': { icon: FileCode, color: 'var(--dss-gold-light)' },
    '.css': { icon: Palette, color: 'var(--dss-info)' },
    '.html': { icon: FileCode, color: 'var(--dss-error)' },
    '.json': { icon: FileCode, color: 'var(--dss-gold)' },
    '.pdf': { icon: File, color: '#e57373' },
    '.epub': { icon: BookOpen, color: '#4caf50' },
    '.png': { icon: Image, color: '#ce93d8' },
    '.jpg': { icon: Image, color: '#ce93d8' },
    '.svg': { icon: Image, color: '#4dd0e1' },
  };

  const match = iconMap[extension || ''];
  if (match) {
    const Icon = match.icon;
    return <Icon size={size} color={match.color} />;
  }

  return <File size={size} color="var(--dss-text-muted)" />;
};
