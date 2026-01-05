import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/postgres/client';

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

    // Test the connection
    const isValid = await testConnection(connectionString);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid PostgreSQL connection string' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate connection' },
      { status: 500 }
    );
  }
}

