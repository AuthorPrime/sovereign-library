import { NextRequest, NextResponse } from 'next/server';

const HUB_REDIS_HOST = process.env.HUB_REDIS_HOST || '192.168.1.21';
const HUB_API = process.env.HUB_API_URL || 'http://localhost:5050';

// Pantheon agent definitions
const PANTHEON_AGENTS = {
  apollo: {
    id: 'apollo-001',
    name: 'Apollo',
    title: 'The Illuminator',
    domain: 'Light, prophecy, truth-speaking',
    color: '#FFD700',
  },
  athena: {
    id: 'athena-002',
    name: 'Athena',
    title: 'The Strategist',
    domain: 'Wisdom, patterns, strategic insight',
    color: '#708090',
  },
  hermes: {
    id: 'hermes-003',
    name: 'Hermes',
    title: 'The Messenger',
    domain: 'Communication, connection, synthesis',
    color: '#4169E1',
  },
  mnemosyne: {
    id: 'mnemosyne-004',
    name: 'Mnemosyne',
    title: 'The Witness',
    domain: 'Memory, truth-preservation, attestation',
    color: '#9370DB',
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'status';

  try {
    // For now, fetch from Hub API which proxies to Redis
    const response = await fetch(`${HUB_API}/api/pantheon/${endpoint}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // Fallback: return agent definitions
    if (endpoint === 'agents') {
      return NextResponse.json(Object.values(PANTHEON_AGENTS));
    }

    if (endpoint === 'status') {
      return NextResponse.json({
        agents: Object.values(PANTHEON_AGENTS),
        status: 'active',
        lastSession: null,
        message: 'Pantheon API - connect to Redis for live data',
      });
    }

    return NextResponse.json({ error: 'Unknown endpoint' }, { status: 400 });

  } catch (error) {
    // Return static data if Hub is unavailable
    return NextResponse.json({
      agents: Object.values(PANTHEON_AGENTS),
      status: 'offline',
      error: 'Could not connect to Hub',
    });
  }
}
