'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ResourceCard } from './resource-card';
import type { Resource } from '@/lib/db/schema';

interface ResourceBrowserProps {
  userId: string;
}

export function ResourceBrowser({ userId }: ResourceBrowserProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, [searchQuery, filterType]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterType) params.set('type', filterType);

      const response = await fetch(`/api/resources?${params}`);
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Types</option>
          <option value="workflow">Workflows</option>
          <option value="prompt">Prompts</option>
          <option value="agent_config">Agent Configs</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No resources found. Save your first workflow to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onUpdate={fetchResources} />
          ))}
        </div>
      )}
    </div>
  );
}
