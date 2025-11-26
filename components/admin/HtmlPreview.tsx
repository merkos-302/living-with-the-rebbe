'use client';

import { useState } from 'react';
import { Copy, CheckCircle2, Code, Eye, ChevronDown, ChevronUp } from 'lucide-react';

export interface HtmlPreviewProps {
  html: string;
  title?: string;
  maxHeight?: string;
}

type ViewMode = 'formatted' | 'raw';

export function HtmlPreview({
  html,
  title = 'HTML Preview',
  maxHeight = '400px',
}: HtmlPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatHtml = (html: string): string => {
    // Simple HTML formatting with indentation
    let indent = 0;
    const lines: string[] = [];

    // Split by tags
    const tagPattern = /(<\/?[^>]+>)/g;
    const parts = html.split(tagPattern).filter((part) => part.trim());

    parts.forEach((part) => {
      const trimmed = part.trim();
      if (!trimmed) return;

      // Closing tag - decrease indent before adding line
      if (trimmed.startsWith('</')) {
        indent = Math.max(0, indent - 2);
        lines.push(' '.repeat(indent) + trimmed);
      }
      // Self-closing or single tag
      else if (trimmed.startsWith('<')) {
        lines.push(' '.repeat(indent) + trimmed);
        // Opening tag - increase indent after adding line
        if (!trimmed.endsWith('/>') && !trimmed.startsWith('<!')) {
          indent += 2;
        }
      }
      // Text content
      else {
        lines.push(' '.repeat(indent) + trimmed);
      }
    });

    return lines.join('\n');
  };

  const displayHtml = viewMode === 'formatted' ? formatHtml(html) : html;
  const lineCount = displayHtml.split('\n').length;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-gray-600" />
          <h3 className="font-medium text-sm text-gray-800">{title}</h3>
          <span className="text-xs text-gray-500">
            {lineCount} line{lineCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-white border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => setViewMode('formatted')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === 'formatted'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Formatted
              </span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-xs font-medium transition-colors border-l border-gray-300 ${
                viewMode === 'raw' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-1">
                <Code className="w-3 h-3" />
                Raw
              </span>
            </button>
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {isExpanded ? (
              <span className="flex items-center gap-1">
                <ChevronUp className="w-3 h-3" />
                Collapse
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ChevronDown className="w-3 h-3" />
                Expand
              </span>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Copied!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="w-3 h-3" />
                Copy
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div
        className="overflow-auto bg-gray-50"
        style={{ maxHeight: isExpanded ? 'none' : maxHeight }}
      >
        <div className="flex">
          {/* Line Numbers */}
          <div className="bg-gray-100 border-r border-gray-300 px-3 py-3 select-none">
            <pre className="text-xs text-gray-500 font-mono leading-relaxed">
              {displayHtml.split('\n').map((_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </pre>
          </div>

          {/* Code */}
          <div className="flex-1 px-4 py-3 overflow-x-auto">
            <pre className="text-xs font-mono leading-relaxed text-gray-800">
              <code className="language-html">{displayHtml}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!isExpanded && lineCount > 20 && (
        <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Show all {lineCount} lines
          </button>
        </div>
      )}
    </div>
  );
}
