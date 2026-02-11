import React, { useEffect } from 'react';
import { useTemplateStore } from '../../stores/templateStore';
import { useEditorStore } from '../../stores/editorStore';
import { TemplateCard } from './TemplateCard';

export const TemplateBrowser: React.FC = () => {
  const templates = useTemplateStore((s) => s.templates);
  const loading = useTemplateStore((s) => s.loading);
  const loadTemplates = useTemplateStore((s) => s.loadTemplates);
  const openFile = useEditorStore((s) => s.openFile);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleClick = async (template: typeof templates[0]) => {
    try {
      if (window.electronAPI) {
        const content = await window.electronAPI.readTemplate(template.name);
        openFile(template.path, content);
      }
    } catch {
      // Can't read template
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--dss-text-muted)' }}>
        Loading templates...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        padding: '8px 12px',
        fontSize: 10,
        color: 'var(--dss-text-muted)',
        borderBottom: '1px solid var(--dss-border)',
      }}>
        DSS publishing templates from ~/.dss/templates/
      </div>
      {templates.map((t) => (
        <TemplateCard key={t.name} template={t} onClick={() => handleClick(t)} />
      ))}
      {templates.length === 0 && (
        <div style={{ padding: 16, color: 'var(--dss-text-muted)', fontSize: 12, textAlign: 'center' }}>
          No templates found. Check ~/.dss/templates/
        </div>
      )}
    </div>
  );
};
