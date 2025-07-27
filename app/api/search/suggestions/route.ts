import { NextRequest, NextResponse } from 'next/server'
import { SearchEngine } from '@/lib/search'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json([])
    }

    const suggestions = await SearchEngine.getSearchSuggestions(query, limit)
    return NextResponse.json(suggestions)

  } catch (error) {
    console.error('Error getting search suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}