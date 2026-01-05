import { NextRequest, NextResponse } from 'next/server';
import { getTables } from '@/lib/postgres/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    // Get tables
    const tables = await getTables(connectionString);

    return NextResponse.json({ tables });
  } catch (error: any) {
    console.error('Get tables error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

