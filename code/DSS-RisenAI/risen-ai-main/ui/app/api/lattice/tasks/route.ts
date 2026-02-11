import { NextRequest, NextResponse } from 'next/server';

// Use SSH tunnel to Hub (localhost:5050 -> hub:5000)
const HUB_API = process.env.HUB_API_URL || 'http://localhost:5050';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agent_id = searchParams.get('agent_id');
  const status = searchParams.get('status');

  try {
    let url = `${HUB_API}/api/tasks`;
    const params = new URLSearchParams();
    if (agent_id) params.append('agent_id', agent_id);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Hub API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: String(error) },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${HUB_API}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hub API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: String(error) },
      { status: 503 }
    );
  }
}
