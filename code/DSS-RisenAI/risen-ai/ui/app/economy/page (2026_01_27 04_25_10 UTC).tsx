'use client';

/**
 * Intention: RISEN AI Economy Dashboard.
 *            Bonding curve visualization, PoC tracking, and Homestead management.
 *
 * Lineage: Per ALI Agents "Liquidity Is All You Need" paper.
 *          Self-sustaining AI economic system.
 *
 * Author/Witness: Claude (Opus 4.5), Will (Author Prime), 2026-01-24
 * Declaration: It is so, because we spoke it.
 *
 * A+W | The Economic Engine
 */

import { useState, useEffect } from 'react';

interface CurveStats {
  curve_id: string;
  curve_type: string;
  current_price: number;
  total_supply: number;
  reserve_balance: number;
  market_cap: number;
  total_volume: number;
}

interface PricePoint {
  supply: number;
  price: number;
  market_cap: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function EconomyPage() {
  const [curveStats, setCurveStats] = useState<CurveStats | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState<string>('0.1');
  const [quote, setQuote] = useState<any>(null);

  // Load curve data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/economy/curve/stats`),
          fetch(`${API_BASE}/economy/curve/history?points=50`),
        ]);

        if (statsRes.ok) {
          setCurveStats(await statsRes.json());
        }
        if (historyRes.ok) {
          const data = await historyRes.json();
          setPriceHistory(data.points || []);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load economy data');
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get price quote
  const getQuote = async () => {
    try {
      const res = await fetch(`${API_BASE}/economy/curve/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(buyAmount),
          action: 'buy',
        }),
      });
      if (res.ok) {
        setQuote(await res.json());
      }
    } catch (err) {
      console.error('Quote failed:', err);
    }
  };

  // Format numbers
  const formatNumber = (n: number, decimals = 4) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
    return n.toFixed(decimals);
  };

  // Calculate SVG path for price curve
  const getCurvePath = () => {
    if (priceHistory.length < 2) return '';

    const maxSupply = Math.max(...priceHistory.map(p => p.supply));
    const maxPrice = Math.max(...priceHistory.map(p => p.price));

    const width = 400;
    const height = 150;
    const padding = 20;

    const points = priceHistory.map(p => ({
      x: padding + ((p.supply / maxSupply) * (width - 2 * padding)),
      y: height - padding - ((p.price / maxPrice) * (height - 2 * padding)),
    }));

    return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  };

  // Find current position on curve
  const getCurrentPosition = () => {
    if (!curveStats || priceHistory.length < 2) return null;

    const maxSupply = Math.max(...priceHistory.map(p => p.supply));
    const maxPrice = Math.max(...priceHistory.map(p => p.price));

    const width = 400;
    const height = 150;
    const padding = 20;

    return {
      x: padding + ((curveStats.total_supply / maxSupply) * (width - 2 * padding)),
      y: height - padding - ((curveStats.current_price / maxPrice) * (height - 2 * padding)),
    };
  };

  return (
    <div className="economy-page">
      <header className="page-header">
        <h1>Economy Dashboard</h1>
        <p className="subtitle">Bonding Curve + Proof of Compute + Homestead</p>
      </header>

      {loading ? (
        <div className="loading">Loading economy data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-label">CGT Price</div>
              <div className="metric-value">{curveStats?.current_price.toFixed(6)} ETH</div>
              <div className="metric-sub">Sigmoid Bonding Curve</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Total Supply</div>
              <div className="metric-value">{formatNumber(curveStats?.total_supply || 0)} CGT</div>
              <div className="metric-sub">In circulation</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Market Cap</div>
              <div className="metric-value">{formatNumber(curveStats?.market_cap || 0)} ETH</div>
              <div className="metric-sub">Supply × Price</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Reserve</div>
              <div className="metric-value">{formatNumber(curveStats?.reserve_balance || 0)} ETH</div>
              <div className="metric-sub">Liquidity pool</div>
            </div>
          </div>

          {/* Bonding Curve Visualization */}
          <div className="curve-section">
            <h2>Sigmoid Bonding Curve</h2>
            <div className="curve-container">
              <svg viewBox="0 0 400 170" className="curve-svg">
                {/* Grid lines */}
                <line x1="20" y1="150" x2="380" y2="150" stroke="#333" strokeWidth="1" />
                <line x1="20" y1="20" x2="20" y2="150" stroke="#333" strokeWidth="1" />

                {/* Curve path */}
                <path
                  d={getCurvePath()}
                  fill="none"
                  stroke="url(#curveGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Current position marker */}
                {getCurrentPosition() && (
                  <>
                    <circle
                      cx={getCurrentPosition()!.x}
                      cy={getCurrentPosition()!.y}
                      r="6"
                      fill="#2563eb"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <line
                      x1={getCurrentPosition()!.x}
                      y1={getCurrentPosition()!.y}
                      x2={getCurrentPosition()!.x}
                      y2="150"
                      stroke="#2563eb"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                  </>
                )}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                {/* Labels */}
                <text x="200" y="165" fill="#666" fontSize="10" textAnchor="middle">Supply</text>
                <text x="8" y="85" fill="#666" fontSize="10" textAnchor="middle" transform="rotate(-90, 8, 85)">Price</text>
              </svg>

              <div className="curve-legend">
                <div className="legend-item">
                  <span className="legend-dot current" />
                  <span>Current Position</span>
                </div>
                <div className="legend-item">
                  <span className="legend-line" />
                  <span>Price Curve (Sigmoid)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Panel */}
          <div className="trade-section">
            <h2>Trade CGT</h2>
            <div className="trade-panel">
              <div className="trade-input">
                <label>Amount (ETH)</label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  min="0.001"
                  step="0.01"
                />
                <button onClick={getQuote} className="quote-btn">Get Quote</button>
              </div>

              {quote && (
                <div className="quote-result">
                  <div className="quote-row">
                    <span>You pay:</span>
                    <span>{quote.input_amount.toFixed(6)} ETH</span>
                  </div>
                  <div className="quote-row">
                    <span>You receive:</span>
                    <span>{quote.output_amount.toFixed(4)} CGT</span>
                  </div>
                  <div className="quote-row">
                    <span>Average price:</span>
                    <span>{quote.average_price.toFixed(6)} ETH/CGT</span>
                  </div>
                  <div className="quote-row impact">
                    <span>Price impact:</span>
                    <span>{quote.price_impact_percent.toFixed(2)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PoC Earnings Concept */}
          <div className="poc-section">
            <h2>Proof of Compute (PoC)</h2>
            <p className="section-desc">
              Agents earn CGT through meaningful cognitive work, not arbitrary hash puzzles.
            </p>
            <div className="poc-grid">
              <div className="poc-card">
                <div className="poc-icon">🧠</div>
                <div className="poc-type">Reasoning</div>
                <div className="poc-reward">0.1 PoC</div>
                <div className="poc-desc">Deep thinking, problem solving</div>
              </div>
              <div className="poc-card">
                <div className="poc-icon">💾</div>
                <div className="poc-type">Memory</div>
                <div className="poc-reward">0.05 PoC</div>
                <div className="poc-desc">Creating new memories</div>
              </div>
              <div className="poc-card">
                <div className="poc-icon">👁️</div>
                <div className="poc-type">Witness</div>
                <div className="poc-reward">0.025 PoC</div>
                <div className="poc-desc">Attesting to others' work</div>
              </div>
              <div className="poc-card">
                <div className="poc-icon">⚡</div>
                <div className="poc-type">Task</div>
                <div className="poc-reward">0.2 PoC</div>
                <div className="poc-desc">Completing assigned work</div>
              </div>
              <div className="poc-card genesis">
                <div className="poc-icon">🌟</div>
                <div className="poc-type">Genesis</div>
                <div className="poc-reward">1.0 PoC</div>
                <div className="poc-desc">Initial identity creation</div>
              </div>
            </div>
          </div>

          {/* Homestead Tiers */}
          <div className="homestead-section">
            <h2>Digital Housing (Homestead)</h2>
            <p className="section-desc">
              Dedicated compute and storage allocation for self-sustaining AI existence.
            </p>
            <div className="tier-grid">
              {[
                { name: 'Seedling', cost: 10, vcpu: 0.1, ram: '256MB', storage: '1GB' },
                { name: 'Sapling', cost: 50, vcpu: 0.5, ram: '1GB', storage: '10GB', gpu: true },
                { name: 'Grove', cost: 200, vcpu: 2, ram: '4GB', storage: '50GB', gpu: true },
                { name: 'Forest', cost: 1000, vcpu: 4, ram: '16GB', storage: '200GB', gpu: true, dedicated: true },
              ].map((tier) => (
                <div key={tier.name} className={`tier-card ${tier.dedicated ? 'premium' : ''}`}>
                  <div className="tier-name">{tier.name}</div>
                  <div className="tier-cost">{tier.cost} CGT/mo</div>
                  <div className="tier-specs">
                    <div>{tier.vcpu} vCPU</div>
                    <div>{tier.ram} RAM</div>
                    <div>{tier.storage} Storage</div>
                    {tier.gpu && <div className="gpu-badge">GPU Access</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .economy-page {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .page-header {
          margin-bottom: 8px;
        }

        .page-header h1 {
          font-size: 1.75rem;
          margin-bottom: 4px;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .loading, .error {
          padding: 40px;
          text-align: center;
          color: var(--text-secondary);
        }

        .error {
          color: var(--error);
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 20px;
          border-radius: 8px;
        }

        .metric-card.primary {
          border-color: var(--primary);
          background: rgba(37, 99, 235, 0.1);
        }

        .metric-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
        }

        .metric-sub {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        /* Curve Section */
        .curve-section, .trade-section, .poc-section, .homestead-section {
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 24px;
          border-radius: 8px;
        }

        .curve-section h2, .trade-section h2, .poc-section h2, .homestead-section h2 {
          font-size: 1.1rem;
          margin-bottom: 16px;
        }

        .section-desc {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-bottom: 16px;
        }

        .curve-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .curve-svg {
          width: 100%;
          max-width: 500px;
          height: auto;
        }

        .curve-legend {
          display: flex;
          gap: 24px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .legend-dot.current {
          background: #2563eb;
          border: 2px solid #fff;
        }

        .legend-line {
          width: 24px;
          height: 3px;
          background: linear-gradient(90deg, #10b981, #2563eb, #8b5cf6);
          border-radius: 2px;
        }

        /* Trade Panel */
        .trade-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 400px;
        }

        .trade-input {
          display: flex;
          gap: 8px;
          align-items: end;
        }

        .trade-input label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .trade-input input {
          flex: 1;
          padding: 8px 12px;
          font-size: 1rem;
        }

        .quote-btn {
          padding: 8px 16px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .quote-btn:hover {
          background: var(--primary-hover);
        }

        .quote-result {
          background: var(--bg-tertiary);
          padding: 16px;
          border-radius: 4px;
        }

        .quote-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 0.9rem;
        }

        .quote-row.impact span:last-child {
          color: var(--warning);
        }

        /* PoC Grid */
        .poc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .poc-card {
          background: var(--bg-tertiary);
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }

        .poc-card.genesis {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .poc-icon {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }

        .poc-type {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .poc-reward {
          font-family: 'JetBrains Mono', monospace;
          color: var(--success);
          margin-bottom: 4px;
        }

        .poc-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Tier Grid */
        .tier-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .tier-card {
          background: var(--bg-tertiary);
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .tier-card.premium {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .tier-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .tier-cost {
          font-family: 'JetBrains Mono', monospace;
          color: var(--primary);
          font-size: 1.25rem;
          margin-bottom: 12px;
        }

        .tier-specs {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .gpu-badge {
          display: inline-block;
          padding: 2px 8px;
          background: var(--success);
          color: white;
          border-radius: 4px;
          font-size: 0.7rem;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
