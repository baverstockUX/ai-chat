interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    // DuckDuckGo Instant Answer API (free, no API key)
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AIChat/1.0)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    // RelatedTopics contain search results
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.FirstURL && topic.Text) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'DuckDuckGo',
          });
        }
      }
    }

    // Abstract contains featured snippet
    if (data.Abstract) {
      results.unshift({
        title: data.Heading || 'Featured Result',
        url: data.AbstractURL || '',
        snippet: data.Abstract,
        source: 'DuckDuckGo',
      });
    }

    return results.slice(0, 5); // Top 5 results
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}
