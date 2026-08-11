import { NextRequest, NextResponse } from 'next/server';
import { searchTrains } from '@/lib/railradar';
import { searchLocalTrains } from '@/lib/trains-db';
import { getCached, setCached } from '@/lib/cache';
import { ApiResponse } from '@/types/api';
import { SearchResult } from '@/types/train';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const cacheKey = `search:${query.toLowerCase().trim()}`;

  const cached = getCached<SearchResult[]>(cacheKey);
  if (cached) {
    return NextResponse.json<ApiResponse<SearchResult[]>>({
      success: true,
      data: cached,
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const results = await searchTrains(query);
    setCached(cacheKey, results, query ? 600 : 120);

    return NextResponse.json<ApiResponse<SearchResult[]>>({
      success: true,
      data: results,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (err.message?.includes('RAILRADAR_NOT_CONFIGURED')) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'RAILRADAR_NOT_CONFIGURED: RAILRADAR_API_KEY is not configured in your environment.',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: err.message || 'Search request failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
