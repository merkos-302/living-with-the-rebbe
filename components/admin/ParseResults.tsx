'use client';

import { ParsedResource, ResourceType } from '@/types/parser';
import { ResourcePreview, ResourceStatus } from './ResourcePreview';
import { useState, useMemo } from 'react';
import { FileText, Image, File, Download, Filter, X, Copy, CheckCircle2 } from 'lucide-react';

export interface ParseResultsProps {
  resources: ParsedResource[];
  resourceStatuses?: Record<string, ResourceStatus>;
  cmsUrls?: Record<string, string>;
  errors?: Record<string, string>;
  onClear?: () => void;
}

type FilterType = 'all' | ResourceType;

export function ParseResults({
  resources,
  resourceStatuses = {},
  cmsUrls = {},
  errors = {},
  onClear,
}: ParseResultsProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [copied, setCopied] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const counts = {
      total: resources.length,
      [ResourceType.PDF]: 0,
      [ResourceType.IMAGE]: 0,
      [ResourceType.DOCUMENT]: 0,
      [ResourceType.UNKNOWN]: 0,
    };

    resources.forEach((resource) => {
      counts[resource.type]++;
    });

    return counts;
  }, [resources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    if (filter === 'all') return resources;
    return resources.filter((resource) => resource.type === filter);
  }, [resources, filter]);

  // Handle export as JSON
  const handleExportJson = async () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      total: resources.length,
      statistics: stats,
      resources: resources.map((resource) => ({
        ...resource,
        status: resourceStatuses[resource.normalizedUrl] || 'pending',
        cmsUrl: cmsUrls[resource.normalizedUrl],
        error: errors[resource.normalizedUrl],
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: download as file
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resources-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (resources.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Download className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No resources found</p>
        <p className="text-sm text-gray-500 mt-1">Parse HTML content to extract resources</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Resources Found</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Export JSON
                </>
              )}
            </button>
            {onClear && (
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            icon={<Download className="w-5 h-5" />}
            label="Total"
            count={stats.total}
            color="gray"
          />
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="PDFs"
            count={stats[ResourceType.PDF]}
            color="red"
          />
          <StatCard
            icon={<Image className="w-5 h-5" />}
            label="Images"
            count={stats[ResourceType.IMAGE]}
            color="blue"
          />
          <StatCard
            icon={<File className="w-5 h-5" />}
            label="Documents"
            count={stats[ResourceType.DOCUMENT]}
            color="green"
          />
          <StatCard
            icon={<Download className="w-5 h-5" />}
            label="Unknown"
            count={stats[ResourceType.UNKNOWN]}
            color="purple"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        <div className="flex gap-1">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="All"
            count={stats.total}
          />
          <FilterButton
            active={filter === ResourceType.PDF}
            onClick={() => setFilter(ResourceType.PDF)}
            label="PDFs"
            count={stats[ResourceType.PDF]}
          />
          <FilterButton
            active={filter === ResourceType.IMAGE}
            onClick={() => setFilter(ResourceType.IMAGE)}
            label="Images"
            count={stats[ResourceType.IMAGE]}
          />
          <FilterButton
            active={filter === ResourceType.DOCUMENT}
            onClick={() => setFilter(ResourceType.DOCUMENT)}
            label="Docs"
            count={stats[ResourceType.DOCUMENT]}
          />
          <FilterButton
            active={filter === ResourceType.UNKNOWN}
            onClick={() => setFilter(ResourceType.UNKNOWN)}
            label="Unknown"
            count={stats[ResourceType.UNKNOWN]}
          />
        </div>
      </div>

      {/* Resources List */}
      <div className="space-y-2">
        {filteredResources.map((resource, index) => (
          <ResourcePreview
            key={`${resource.normalizedUrl}-${index}`}
            resource={resource}
            status={resourceStatuses[resource.normalizedUrl]}
            cmsUrl={cmsUrls[resource.normalizedUrl]}
            error={errors[resource.normalizedUrl]}
          />
        ))}
      </div>

      {filteredResources.length === 0 && filter !== 'all' && (
        <div className="text-center py-8 text-gray-500">No {filter} resources found</div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: 'gray' | 'red' | 'blue' | 'green' | 'purple';
}

function StatCard({ icon, label, count, color }: StatCardProps) {
  const colorClasses = {
    gray: 'text-gray-600 bg-gray-100',
    red: 'text-red-600 bg-red-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
  };

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className={`flex items-center gap-2 mb-1 ${colorClasses[color]}`}>
        <div className="p-1 rounded">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{count}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

function FilterButton({ active, onClick, label, count }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label} ({count})
    </button>
  );
}
