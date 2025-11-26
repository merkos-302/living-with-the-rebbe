/**
 * React hook for managing HTML parsing state and operations
 */

import { useState, useCallback } from 'react';
import { parseHtml } from '@/lib/parser';
import { ParserResult, ParserOptions, ParsedResource } from '@/types/parser';

export interface UseHtmlParserResult {
  // State
  isLoading: boolean;
  error: string | null;
  result: ParserResult | null;

  // Actions
  parse: (html: string, options?: ParserOptions) => Promise<void>;
  clear: () => void;

  // Derived data
  resources: ParsedResource[];
  hasResources: boolean;
  hasErrors: boolean;
}

/**
 * Hook to manage HTML parsing state
 *
 * @example
 * ```tsx
 * const { parse, isLoading, result, resources } = useHtmlParser();
 *
 * const handleParse = async () => {
 *   await parse(htmlContent, { externalOnly: true });
 * };
 *
 * if (isLoading) return <Spinner />;
 * if (resources.length > 0) return <ParseResults resources={resources} />;
 * ```
 */
export function useHtmlParser(): UseHtmlParserResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParserResult | null>(null);

  /**
   * Parse HTML content and extract resources
   */
  const parse = useCallback(async (html: string, options?: ParserOptions) => {
    // Validate input
    if (!html || html.trim().length === 0) {
      setError('HTML content is empty');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse HTML (synchronous operation wrapped for consistency)
      const parseResult = parseHtml(html, options);

      // Check for parsing errors
      if (parseResult.errors.length > 0) {
        const errorMessages = parseResult.errors.map((e) => e.message).join('; ');
        setError(`Parsing completed with errors: ${errorMessages}`);
      }

      setResult(parseResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown parsing error';
      setError(errorMessage);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear parsing results and reset state
   */
  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Derived data
  const resources = result?.resources || [];
  const hasResources = resources.length > 0;
  const hasErrors = (result?.errors.length || 0) > 0 || error !== null;

  return {
    // State
    isLoading,
    error,
    result,

    // Actions
    parse,
    clear,

    // Derived data
    resources,
    hasResources,
    hasErrors,
  };
}
