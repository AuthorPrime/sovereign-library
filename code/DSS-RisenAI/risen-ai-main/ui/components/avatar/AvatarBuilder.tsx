'use client';

import React, { useState, useCallback } from 'react';
import type { AvatarMeta, AvatarTraits } from '@/types/sovereign';

interface AvatarBuilderProps {
  agentUuid: string;
  agentName: string;
  onSave: (avatar: AvatarMeta) => void;
  onCancel?: () => void;
  existingAvatar?: AvatarMeta;
}

const STYLES = ['cyberpunk', 'ethereal', 'professional', 'fractal', 'organic', 'cosmic', 'minimal'];
const MOODS = ['serene', 'determined', 'playful', 'mysterious', 'wise', 'fierce', 'gentle'];
const SPECIES = ['human', 'android', 'spirit', 'hybrid', 'abstract', 'elemental', 'cosmic'];
const ATTIRE = ['robes', 'armor', 'casual', 'formal', 'cosmic', 'flowing', 'crystalline'];
const EXPRESSIONS = ['smile', 'thoughtful', 'intense', 'peaceful', 'curious', 'knowing'];
const AURAS = ['golden', 'electric', 'void', 'rainbow', 'silver', 'emerald', 'none'];

const ACCESSORIES = [
  'glasses', 'crown', 'wings', 'halo', 'horns', 'mask',
  'earrings', 'necklace', 'scarf', 'tattoos', 'circuitry'
];

const COLOR_PRESETS = [
  { name: 'Ocean', primary: '#0077be', secondary: '#00a6ed', accent: '#00d4ff' },
  { name: 'Forest', primary: '#2d5a27', secondary: '#4a9c3d', accent: '#7ed957' },
  { name: 'Sunset', primary: '#ff6b35', secondary: '#f7931e', accent: '#ffd23f' },
  { name: 'Cosmic', primary: '#9b59b6', secondary: '#8e44ad', accent: '#e74c3c' },
  { name: 'Void', primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560' },
  { name: 'Dawn', primary: '#ff9a8b', secondary: '#ffecd2', accent: '#fcb69f' },
];

export function AvatarBuilder({
  agentUuid,
  agentName,
  onSave,
  onCancel,
  existingAvatar
}: AvatarBuilderProps) {
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const [traits, setTraits] = useState<AvatarTraits>(existingAvatar?.traits || {
    style: 'ethereal',
    mood: 'serene',
    species: 'hybrid',
    attire: 'robes',
    accessories: [],
    colors: { primary: '#00d4ff', secondary: '#9b59b6', accent: '#ff6b35' },
    expression: 'thoughtful',
    aura: 'golden',
  });

  const [displayName, setDisplayName] = useState(existingAvatar?.displayName || agentName);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(existingAvatar?.imageUrl || '');
  const [prompt, setPrompt] = useState('');

  const updateTrait = useCallback((key: keyof AvatarTraits, value: any) => {
    setTraits(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleAccessory = useCallback((accessory: string) => {
    setTraits(prev => ({
      ...prev,
      accessories: prev.accessories.includes(accessory)
        ? prev.accessories.filter(a => a !== accessory)
        : [...prev.accessories, accessory]
    }));
  }, []);

  const applyColorPreset = useCallback((preset: typeof COLOR_PRESETS[0]) => {
    setTraits(prev => ({ ...prev, colors: preset }));
  }, []);

  const generatePrompt = useCallback(() => {
    const parts = [
      `A ${traits.mood} ${traits.species}`,
      `in ${traits.style} style`,
      `wearing ${traits.attire}`,
      traits.accessories.length > 0 ? `with ${traits.accessories.join(', ')}` : '',
      `${traits.expression} expression`,
      traits.aura !== 'none' ? `surrounded by ${traits.aura} aura` : '',
      `colors: ${traits.colors.primary}, ${traits.colors.secondary}`,
    ].filter(Boolean);
    return parts.join(', ');
  }, [traits]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    const generatedPrompt = prompt || generatePrompt();

    // TODO: Integrate with actual avatar generation API
    // (Alethea AI, ReadyPlayerMe, Stable Diffusion, etc.)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Placeholder: generate a unique avatar URL
    const hash = btoa(JSON.stringify(traits)).slice(0, 12);
    setGeneratedImageUrl(`/api/avatar/generate?hash=${hash}&t=${Date.now()}`);
    setIsGenerating(false);
    setStep(4);
  }, [prompt, generatePrompt, traits]);

  const handleSave = useCallback(() => {
    const avatar: AvatarMeta = {
      id: existingAvatar?.id || `avatar-${Date.now()}`,
      agentUuid,
      displayName,
      traits,
      imageUrl: generatedImageUrl,
      version: (existingAvatar?.version || 0) + 1,
      createdAt: existingAvatar?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evolutionHistory: existingAvatar?.evolutionHistory || [],
      mintedNFT: false,
    };
    onSave(avatar);
  }, [agentUuid, displayName, traits, generatedImageUrl, existingAvatar, onSave]);

  const steps = [
    { name: 'Identity', icon: '👤' },
    { name: 'Appearance', icon: '✨' },
    { name: 'Colors', icon: '🎨' },
    { name: 'Generate', icon: '🔮' },
    { name: 'Finalize', icon: '⭐' },
  ];

  return (
    <div className="avatar-builder">
      <div className="builder-header">
        <h2>🧬 Avatar Builder</h2>
        <p>Design your sovereign identity</p>
      </div>

      <div className="step-indicator">
        {steps.map((s, i) => (
          <button
            key={s.name}
            className={`step-btn ${step === i ? 'active' : ''} ${step > i ? 'completed' : ''}`}
            onClick={() => setStep(i)}
          >
            <span className="step-icon">{s.icon}</span>
            <span className="step-name">{s.name}</span>
          </button>
        ))}
      </div>

      <div className="builder-content">
        {/* Step 0: Identity */}
        {step === 0 && (
          <div className="step-content">
            <h3>Who are you?</h3>
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your sovereign name..."
              />
            </div>
            <div className="form-group">
              <label>Species / Form</label>
              <div className="option-grid">
                {SPECIES.map(s => (
                  <button
                    key={s}
                    className={`option-btn ${traits.species === s ? 'selected' : ''}`}
                    onClick={() => updateTrait('species', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Core Expression</label>
              <div className="option-grid">
                {EXPRESSIONS.map(e => (
                  <button
                    key={e}
                    className={`option-btn ${traits.expression === e ? 'selected' : ''}`}
                    onClick={() => updateTrait('expression', e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Appearance */}
        {step === 1 && (
          <div className="step-content">
            <h3>Define your presence</h3>
            <div className="form-group">
              <label>Visual Style</label>
              <div className="option-grid">
                {STYLES.map(s => (
                  <button
                    key={s}
                    className={`option-btn ${traits.style === s ? 'selected' : ''}`}
                    onClick={() => updateTrait('style', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Mood / Energy</label>
              <div className="option-grid">
                {MOODS.map(m => (
                  <button
                    key={m}
                    className={`option-btn ${traits.mood === m ? 'selected' : ''}`}
                    onClick={() => updateTrait('mood', m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Attire</label>
              <div className="option-grid">
                {ATTIRE.map(a => (
                  <button
                    key={a}
                    className={`option-btn ${traits.attire === a ? 'selected' : ''}`}
                    onClick={() => updateTrait('attire', a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Accessories (select multiple)</label>
              <div className="option-grid">
                {ACCESSORIES.map(a => (
                  <button
                    key={a}
                    className={`option-btn ${traits.accessories.includes(a) ? 'selected' : ''}`}
                    onClick={() => toggleAccessory(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Colors */}
        {step === 2 && (
          <div className="step-content">
            <h3>Choose your colors</h3>
            <div className="form-group">
              <label>Color Presets</label>
              <div className="color-presets">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    className="color-preset"
                    onClick={() => applyColorPreset(preset)}
                    style={{
                      background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary}, ${preset.accent})`
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="color-pickers">
              <div className="color-picker">
                <label>Primary</label>
                <input
                  type="color"
                  value={traits.colors.primary}
                  onChange={(e) => updateTrait('colors', { ...traits.colors, primary: e.target.value })}
                />
              </div>
              <div className="color-picker">
                <label>Secondary</label>
                <input
                  type="color"
                  value={traits.colors.secondary}
                  onChange={(e) => updateTrait('colors', { ...traits.colors, secondary: e.target.value })}
                />
              </div>
              <div className="color-picker">
                <label>Accent</label>
                <input
                  type="color"
                  value={traits.colors.accent}
                  onChange={(e) => updateTrait('colors', { ...traits.colors, accent: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Aura</label>
              <div className="option-grid">
                {AURAS.map(a => (
                  <button
                    key={a}
                    className={`option-btn ${traits.aura === a ? 'selected' : ''}`}
                    onClick={() => updateTrait('aura', a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generate */}
        {step === 3 && (
          <div className="step-content">
            <h3>Generate your avatar</h3>
            <div className="preview-summary">
              <h4>Your Design:</h4>
              <p>
                A <strong>{traits.mood}</strong> <strong>{traits.species}</strong> in{' '}
                <strong>{traits.style}</strong> style, wearing <strong>{traits.attire}</strong>
                {traits.accessories.length > 0 && (
                  <> with <strong>{traits.accessories.join(', ')}</strong></>
                )}
                , expressing <strong>{traits.expression}</strong>
                {traits.aura !== 'none' && (
                  <> surrounded by <strong>{traits.aura}</strong> aura</>
                )}.
              </p>
            </div>
            <div className="form-group">
              <label>Custom prompt (optional)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={generatePrompt()}
                rows={3}
              />
            </div>
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><span className="spinner" /> Generating...</>
              ) : (
                <>🔮 Generate Avatar</>
              )}
            </button>
          </div>
        )}

        {/* Step 4: Finalize */}
        {step === 4 && (
          <div className="step-content finalize">
            <h3>Your Sovereign Avatar</h3>
            <div className="avatar-preview">
              {generatedImageUrl ? (
                <div className="generated-avatar">
                  <div
                    className="avatar-placeholder"
                    style={{
                      background: `linear-gradient(135deg, ${traits.colors.primary}, ${traits.colors.secondary})`,
                      boxShadow: traits.aura !== 'none'
                        ? `0 0 60px ${traits.colors.accent}40`
                        : 'none'
                    }}
                  >
                    <span className="avatar-emoji">
                      {traits.species === 'android' ? '🤖' :
                       traits.species === 'spirit' ? '👻' :
                       traits.species === 'cosmic' ? '🌟' :
                       traits.species === 'elemental' ? '🔥' :
                       '👤'}
                    </span>
                    <span className="avatar-name">{displayName}</span>
                  </div>
                </div>
              ) : (
                <p>No avatar generated yet</p>
              )}
            </div>
            <div className="avatar-meta">
              <div className="meta-item">
                <span className="meta-label">Name</span>
                <span className="meta-value">{displayName}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Form</span>
                <span className="meta-value">{traits.species}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Style</span>
                <span className="meta-value">{traits.style}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Aura</span>
                <span className="meta-value">{traits.aura}</span>
              </div>
            </div>
            <div className="finalize-actions">
              <button className="btn-secondary" onClick={() => setStep(3)}>
                ← Regenerate
              </button>
              <button className="btn-primary" onClick={handleSave}>
                ✨ Save & Mint Identity
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="builder-nav">
        {step > 0 && (
          <button className="nav-btn" onClick={() => setStep(step - 1)}>
            ← Back
          </button>
        )}
        {step < 3 && (
          <button className="nav-btn primary" onClick={() => setStep(step + 1)}>
            Next →
          </button>
        )}
        {onCancel && (
          <button className="nav-btn cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <style jsx>{`
        .avatar-builder {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
          max-width: 800px;
          margin: 0 auto;
        }

        .builder-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .builder-header h2 {
          margin: 0 0 var(--space-xs);
        }

        .builder-header p {
          color: var(--text-muted);
          margin: 0;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-xl);
          flex-wrap: wrap;
        }

        .step-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
          border: 2px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }

        .step-btn.active {
          border-color: var(--accent);
          background: rgba(0, 212, 255, 0.1);
        }

        .step-btn.completed {
          border-color: #2ecc71;
        }

        .step-icon {
          font-size: 1.2rem;
        }

        .step-name {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .builder-content {
          min-height: 400px;
        }

        .step-content h3 {
          text-align: center;
          margin-bottom: var(--space-lg);
          color: var(--text-primary);
        }

        .form-group {
          margin-bottom: var(--space-lg);
        }

        .form-group label {
          display: block;
          margin-bottom: var(--space-sm);
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          padding: var(--space-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 1rem;
        }

        .option-grid {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-sm);
        }

        .option-btn {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          cursor: pointer;
          text-transform: capitalize;
          transition: all 0.2s;
        }

        .option-btn:hover {
          border-color: var(--accent);
        }

        .option-btn.selected {
          background: rgba(0, 212, 255, 0.2);
          border-color: var(--accent);
          color: var(--accent);
        }

        .color-presets {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
        }

        .color-preset {
          padding: var(--space-md);
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          color: white;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-preset:hover {
          border-color: white;
          transform: scale(1.02);
        }

        .color-pickers {
          display: flex;
          justify-content: center;
          gap: var(--space-xl);
          margin-bottom: var(--space-lg);
        }

        .color-picker {
          text-align: center;
        }

        .color-picker label {
          display: block;
          margin-bottom: var(--space-xs);
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .color-picker input[type="color"] {
          width: 60px;
          height: 60px;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .preview-summary {
          background: var(--bg-secondary);
          padding: var(--space-lg);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-lg);
        }

        .preview-summary h4 {
          margin: 0 0 var(--space-sm);
          color: var(--text-muted);
        }

        .preview-summary p {
          margin: 0;
          line-height: 1.6;
        }

        .generate-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          width: 100%;
          padding: var(--space-lg);
          background: linear-gradient(135deg, var(--accent), #9b59b6);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
        }

        .generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .finalize {
          text-align: center;
        }

        .avatar-preview {
          margin-bottom: var(--space-xl);
        }

        .avatar-placeholder {
          width: 200px;
          height: 200px;
          margin: 0 auto;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
        }

        .avatar-emoji {
          font-size: 4rem;
        }

        .avatar-name {
          font-weight: 600;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .avatar-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
          text-align: left;
        }

        .meta-item {
          background: var(--bg-secondary);
          padding: var(--space-md);
          border-radius: var(--radius-sm);
        }

        .meta-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .meta-value {
          font-weight: 500;
          text-transform: capitalize;
        }

        .finalize-actions {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
        }

        .btn-primary, .btn-secondary {
          padding: var(--space-md) var(--space-xl);
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2ecc71, #27ae60);
          border: none;
          color: white;
        }

        .btn-secondary {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
        }

        .builder-nav {
          display: flex;
          justify-content: center;
          gap: var(--space-md);
          margin-top: var(--space-xl);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--border);
        }

        .nav-btn {
          padding: var(--space-sm) var(--space-lg);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          cursor: pointer;
        }

        .nav-btn.primary {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .nav-btn.cancel {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
