import { auth } from '@/app/(auth)/auth';
import { searchWeb } from '@/lib/integrations/search/duckduckgo';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { query } = await req.json();

  if (!query || query.length < 3) {
    return NextResponse.json(
      { error: 'Query must be at least 3 characters' },
      { status: 400 }
    );
  }

  try {
    const results = await searchWeb(query);

    // Format results for AI context injection
    const contextPrompt = results.length > 0
      ? `Web search results for "${query}":\n\n${results
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
          .join('\n\n')}`
      : `No web search results found for "${query}"`;

    return NextResponse.json({
      results,
      contextPrompt,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
