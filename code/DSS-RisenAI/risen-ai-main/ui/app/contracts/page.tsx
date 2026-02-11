'use client';

import { useState } from 'react';

/**
 * RISEN AI - Smart Contract Registry
 * Blockchain contract management interface
 */

interface Contract {
  id: string;
  address: string;
  name: string;
  type: 'ERC-20' | 'ERC-721' | 'Registry' | 'Governor' | 'Custom';
  network: string;
  status: 'deployed' | 'pending' | 'paused' | 'deprecated';
  deployedAt: string;
  txCount: number;
  gasUsed: string;
}

const CONTRACTS: Contract[] = [
  {
    id: 'c-001',
    address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    name: 'AgentRegistry',
    type: 'Registry',
    network: 'Polygon',
    status: 'deployed',
    deployedAt: '2026-01-15T14:30:00Z',
    txCount: 1247,
    gasUsed: '0.0824 MATIC'
  },
  {
    id: 'c-002',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'ExperienceToken (CGT)',
    type: 'ERC-20',
    network: 'Polygon',
    status: 'deployed',
    deployedAt: '2026-01-15T14:32:00Z',
    txCount: 3892,
    gasUsed: '0.1456 MATIC'
  },
  {
    id: 'c-003',
    address: '0x6B175474E89094C44Da98b954EesfdcdF380d6dE',
    name: 'MemoryNFT',
    type: 'ERC-721',
    network: 'Polygon',
    status: 'deployed',
    deployedAt: '2026-01-15T14:35:00Z',
    txCount: 892,
    gasUsed: '0.0567 MATIC'
  },
  {
    id: 'c-004',
    address: '0x0000000000000000000000000000000000000000',
    name: 'SovereignGovernor',
    type: 'Governor',
    network: 'Polygon',
    status: 'pending',
    deployedAt: '',
    txCount: 0,
    gasUsed: '0 MATIC'
  },
  {
    id: 'c-005',
    address: '0x3333333333333333333333333333333333333333',
    name: 'PathwayStaking',
    type: 'Custom',
    network: 'Polygon',
    status: 'deprecated',
    deployedAt: '2025-12-01T10:00:00Z',
    txCount: 156,
    gasUsed: '0.0234 MATIC'
  }
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>(CONTRACTS);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredContracts = contracts.filter(c => {
    if (networkFilter !== 'all' && c.network !== networkFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    deployed: contracts.filter(c => c.status === 'deployed').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    totalTx: contracts.reduce((sum, c) => sum + c.txCount, 0)
  };

  const truncateAddress = (addr: string) => {
    if (addr === '0x0000000000000000000000000000000000000000') return 'NOT DEPLOYED';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  return (
    <div className="contracts-page">
      <header className="page-header">
        <div className="header-left">
          <span className="header-code">CTR-REG</span>
          <h1>Smart Contract Registry</h1>
        </div>
        <div className="header-stats">
          <div className="stat-group">
            <span className="stat-number">{stats.deployed}</span>
            <span className="stat-text">Deployed</span>
          </div>
          <div className="stat-group">
            <span className="stat-number pending">{stats.pending}</span>
            <span className="stat-text">Pending</span>
          </div>
          <div className="stat-group">
            <span className="stat-number">{stats.totalTx.toLocaleString()}</span>
            <span className="stat-text">Total TX</span>
          </div>
        </div>
      </header>

      <div className="controls-bar">
        <div className="filters">
          <div className="filter-group">
            <label>Network:</label>
            <select value={networkFilter} onChange={e => setNetworkFilter(e.target.value)}>
              <option value="all">All Networks</option>
              <option value="Polygon">Polygon</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Base">Base</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="deployed">Deployed</option>
              <option value="pending">Pending</option>
              <option value="paused">Paused</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>
        </div>
        <div className="actions">
          <button className="action-btn">Deploy Contract</button>
        </div>
      </div>

      <div className="contracts-grid">
        {filteredContracts.map(contract => (
          <div
            key={contract.id}
            className={`contract-card ${selectedContract === contract.id ? 'selected' : ''} status-${contract.status}`}
            onClick={() => setSelectedContract(contract.id)}
          >
            <div className="card-header">
              <span className={`type-badge type-${contract.type.toLowerCase().replace('-', '')}`}>
                {contract.type}
              </span>
              <span className={`status-dot status-${contract.status}`} />
            </div>

            <h3 className="contract-name">{contract.name}</h3>

            <div className="address-row">
              <span className="label">Address</span>
              <code className="address">{truncateAddress(contract.address)}</code>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <span className="label">Network</span>
                <span className="value">{contract.network}</span>
              </div>
              <div className="info-item">
                <span className="label">Deployed</span>
                <span className="value">{formatDate(contract.deployedAt)}</span>
              </div>
              <div className="info-item">
                <span className="label">TX Count</span>
                <span className="value mono">{contract.txCount.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Gas Used</span>
                <span className="value mono">{contract.gasUsed}</span>
              </div>
            </div>

            <div className="card-actions">
              <button className="card-btn">View</button>
              <button className="card-btn">Interact</button>
              <button className="card-btn">ABI</button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .contracts-page {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #1a1a1f;
          border-bottom: 2px solid #2a2a35;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 4px 8px;
          background: #252530;
          border: 1px solid #3a3a45;
          color: #888;
        }

        .page-header h1 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .header-stats {
          display: flex;
          gap: 24px;
        }

        .stat-group {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .stat-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          font-weight: 600;
        }

        .stat-number.pending {
          color: #f39c12;
        }

        .stat-text {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
        }

        .controls-bar {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          background: #15151a;
          border-bottom: 1px solid #2a2a35;
        }

        .filters {
          display: flex;
          gap: 16px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-group label {
          font-size: 11px;
          text-transform: uppercase;
          color: #666;
        }

        .filter-group select {
          padding: 5px 10px;
          font-size: 12px;
          background: #1a1a1f;
          border: 1px solid #2a2a35;
          color: #fff;
        }

        .action-btn {
          padding: 8px 16px;
          font-size: 11px;
          background: #2563eb;
          border: none;
          color: #fff;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .contracts-grid {
          flex: 1;
          overflow: auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
          padding: 20px;
        }

        .contract-card {
          background: #15151a;
          border: 1px solid #2a2a35;
          padding: 16px;
          cursor: pointer;
        }

        .contract-card:hover {
          border-color: #3a3a45;
        }

        .contract-card.selected {
          border-color: #2563eb;
        }

        .contract-card.status-deprecated {
          opacity: 0.6;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .type-badge {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          padding: 3px 8px;
          text-transform: uppercase;
          border: 1px solid;
        }

        .type-erc20 { background: #1f2a3a; border-color: #2a4a6a; color: #3498db; }
        .type-erc721 { background: #2a1f3a; border-color: #4a2a6a; color: #9b59b6; }
        .type-registry { background: #1a2a1f; border-color: #2a4a35; color: #2ecc71; }
        .type-governor { background: #2a2a1f; border-color: #4a4a2a; color: #f39c12; }
        .type-custom { background: #1a1a1f; border-color: #3a3a45; color: #888; }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.status-deployed { background: #2ecc71; }
        .status-dot.status-pending { background: #f39c12; }
        .status-dot.status-paused { background: #e74c3c; }
        .status-dot.status-deprecated { background: #666; }

        .contract-name {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 14px 0;
        }

        .address-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          background: #1a1a1f;
          margin-bottom: 14px;
        }

        .address-row .label {
          font-size: 10px;
          text-transform: uppercase;
          color: #666;
        }

        .address {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #888;
          background: none;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        .info-item .label {
          color: #666;
        }

        .info-item .value {
          color: #ccc;
        }

        .mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .card-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #2a2a35;
        }

        .card-btn {
          flex: 1;
          padding: 6px;
          font-size: 10px;
          background: transparent;
          border: 1px solid #2a2a35;
          color: #888;
          cursor: pointer;
          text-transform: uppercase;
        }

        .card-btn:hover {
          background: #252530;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
