'use client';

import { ParsedResource, ResourceType } from '@/types/parser';
import {
  FileText,
  Image,
  File,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

export type ResourceStatus = 'pending' | 'downloading' | 'uploading' | 'complete' | 'error';

export interface ResourcePreviewProps {
  resource: ParsedResource;
  status?: ResourceStatus;
  cmsUrl?: string;
  error?: string;
}

const getFileTypeIcon = (type: ResourceType) => {
  const iconClass = 'w-6 h-6';

  switch (type) {
    case ResourceType.PDF:
      return <FileText className={`${iconClass} text-red-600`} />;
    case ResourceType.IMAGE:
      return <Image className={`${iconClass} text-blue-600`} />;
    case ResourceType.DOCUMENT:
      return <File className={`${iconClass} text-green-600`} />;
    case ResourceType.UNKNOWN:
    default:
      return <Download className={`${iconClass} text-gray-600`} />;
  }
};

const getStatusBadge = (status: ResourceStatus, error?: string) => {
  switch (status) {
    case 'pending':
      return (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>Pending</span>
        </div>
      );
    case 'downloading':
      return (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Downloading</span>
        </div>
      );
    case 'uploading':
      return (
        <div className="flex items-center gap-1 text-xs text-purple-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Uploading</span>
        </div>
      );
    case 'complete':
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="w-3 h-3" />
          <span>Complete</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-1 text-xs text-red-600" title={error}>
          <XCircle className="w-3 h-3" />
          <span>Error</span>
        </div>
      );
    default:
      return null;
  }
};

const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

const extractFilename = (url: string, extension: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'unknown';
    return filename.split('?')[0] || `resource${extension}`;
  } catch {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1] || '';
    return lastPart.split('?')[0] || `resource${extension}`;
  }
};

export function ResourcePreview({
  resource,
  status = 'pending',
  cmsUrl,
  error,
}: ResourcePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const filename = extractFilename(resource.normalizedUrl, resource.extension);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        {/* File Type Icon */}
        <div className="flex-shrink-0 mt-1">{getFileTypeIcon(resource.type)}</div>

        {/* Resource Info */}
        <div className="flex-1 min-w-0">
          {/* Filename */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-medium text-sm text-gray-900 truncate">{filename}</h4>
            {getStatusBadge(status, error)}
          </div>

          {/* File Type Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {resource.type.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {extractDomain(resource.normalizedUrl)}
            </span>
          </div>

          {/* URLs */}
          <div className="space-y-1">
            {/* Original URL */}
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-gray-500 flex-shrink-0">Original:</span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-800 text-left break-all"
              >
                {isExpanded
                  ? resource.normalizedUrl
                  : `${resource.normalizedUrl.substring(0, 50)}...`}
              </button>
            </div>

            {/* CMS URL if available */}
            {cmsUrl && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-gray-500 flex-shrink-0">CMS:</span>
                <a
                  href={cmsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-800 break-all"
                >
                  {isExpanded ? cmsUrl : `${cmsUrl.substring(0, 50)}...`}
                </a>
              </div>
            )}

            {/* Error message if present */}
            {error && status === 'error' && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
