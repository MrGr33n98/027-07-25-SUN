import { NextRequest, NextResponse } from 'next/server'
import { SearchEngine } from '@/lib/search'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const results = await SearchEngine.globalSearch(query, limit)
    return NextResponse.json(results)

  } catch (error) {
    console.error('Error in global search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}