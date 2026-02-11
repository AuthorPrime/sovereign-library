import { NextRequest, NextResponse } from 'next/server';

// Use SSH tunnel to Hub (localhost:5050 -> hub:5000)
const HUB_API = process.env.HUB_API_URL || 'http://localhost:5050';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'reflections';
  const limit = searchParams.get('limit') || '50';

  try {
    const response = await fetch(`${HUB_API}/api/${endpoint}?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Hub API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Lattice API error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to lattice', details: String(error) },
      { status: 503 }
    );
  }
}
