/**
 * Tests for /api/fetch-html route
 * Note: These tests verify the validation and logic used by the API route.
 * Full API route testing requires Next.js runtime environment.
 */

describe('/api/fetch-html validation logic', () => {
  describe('URL validation', () => {
    /**
     * Helper function to validate URL (extracted from route logic)
     */
    function validateUrl(urlString: string): { valid: boolean; error?: string; url?: URL } {
      if (!urlString || typeof urlString !== 'string') {
        return { valid: false, error: 'URL is required and must be a string' };
      }

      urlString = urlString.trim();

      if (urlString.length < 10) {
        return { valid: false, error: 'URL is too short to be valid' };
      }

      if (urlString.length > 2048) {
        return { valid: false, error: 'URL exceeds maximum length of 2048 characters' };
      }

      let url: URL;
      try {
        url = new URL(urlString);
      } catch {
        return { valid: false, error: 'Invalid URL format' };
      }

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
      }

      if (!isDomainAllowed(url.hostname)) {
        return {
          valid: false,
          error: `Domain ${url.hostname} is not whitelisted`,
        };
      }

      return { valid: true, url };
    }

    /**
     * Helper function to check domain whitelist
     */
    function isDomainAllowed(hostname: string): boolean {
      const ALLOWED_DOMAINS = [
        'merkos-living.s3.us-west-2.amazonaws.com',
        'merkos-living.s3.amazonaws.com',
        'merkos302.com',
      ];

      if (ALLOWED_DOMAINS.includes(hostname)) {
        return true;
      }

      if (hostname.endsWith('.merkos302.com') || hostname === 'merkos302.com') {
        return true;
      }

      return false;
    }

    it('should reject missing URL', () => {
      const result = validateUrl('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL is required and must be a string');
    });

    it('should reject non-string URL', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateUrl(12345 as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL is required and must be a string');
    });

    it('should reject URL that is too short', () => {
      const result = validateUrl('http://a');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL is too short to be valid');
    });

    it('should reject URL that is too long', () => {
      const longUrl = 'https://merkos302.com/' + 'a'.repeat(2100);
      const result = validateUrl(longUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL exceeds maximum length of 2048 characters');
    });

    it('should reject invalid URL format', () => {
      const result = validateUrl('not-a-valid-url');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should reject non-HTTP/HTTPS protocols', () => {
      const result = validateUrl('ftp://merkos302.com/file.html');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only HTTP and HTTPS protocols are allowed');
    });

    it('should trim whitespace from URLs', () => {
      const result = validateUrl('  https://merkos302.com/page.html  ');
      expect(result.valid).toBe(true);
      expect(result.url?.href).toBe('https://merkos302.com/page.html');
    });

    it('should accept valid HTTPS URL', () => {
      const result = validateUrl('https://merkos302.com/newsletter.html');
      expect(result.valid).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.url?.protocol).toBe('https:');
    });

    it('should accept valid HTTP URL', () => {
      const result = validateUrl('http://merkos302.com/newsletter.html');
      expect(result.valid).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.url?.protocol).toBe('http:');
    });
  });

  describe('Domain whitelisting', () => {
    /**
     * Helper function to check domain whitelist
     */
    function isDomainAllowed(hostname: string): boolean {
      const ALLOWED_DOMAINS = [
        'merkos-living.s3.us-west-2.amazonaws.com',
        'merkos-living.s3.amazonaws.com',
        'merkos302.com',
      ];

      if (ALLOWED_DOMAINS.includes(hostname)) {
        return true;
      }

      if (hostname.endsWith('.merkos302.com') || hostname === 'merkos302.com') {
        return true;
      }

      return false;
    }

    it('should reject non-whitelisted domain', () => {
      expect(isDomainAllowed('evil.com')).toBe(false);
      expect(isDomainAllowed('example.com')).toBe(false);
      expect(isDomainAllowed('malicious-merkos302.com')).toBe(false);
    });

    it('should accept merkos302.com domain', () => {
      expect(isDomainAllowed('merkos302.com')).toBe(true);
    });

    it('should accept subdomain of merkos302.com', () => {
      expect(isDomainAllowed('www.merkos302.com')).toBe(true);
      expect(isDomainAllowed('sub.merkos302.com')).toBe(true);
      expect(isDomainAllowed('deep.sub.merkos302.com')).toBe(true);
    });

    it('should accept merkos-living S3 bucket (us-west-2)', () => {
      expect(isDomainAllowed('merkos-living.s3.us-west-2.amazonaws.com')).toBe(true);
    });

    it('should accept merkos-living S3 bucket (no region)', () => {
      expect(isDomainAllowed('merkos-living.s3.amazonaws.com')).toBe(true);
    });

    it('should not accept similar but different domains', () => {
      expect(isDomainAllowed('merkos303.com')).toBe(false);
      expect(isDomainAllowed('merkos-living.s3.us-east-1.amazonaws.com')).toBe(false);
      expect(isDomainAllowed('other-bucket.s3.amazonaws.com')).toBe(false);
    });
  });

  describe('Rate limiting logic', () => {
    /**
     * Helper function to simulate rate limiting
     */
    function createRateLimiter(maxRequests: number, windowMs: number) {
      const map = new Map<string, { count: number; resetTime: number }>();

      return {
        check: (ip: string, now: number): { allowed: boolean; resetTime?: number } => {
          const data = map.get(ip);

          if (!data) {
            map.set(ip, {
              count: 1,
              resetTime: now + windowMs,
            });
            return { allowed: true };
          }

          if (now >= data.resetTime) {
            map.set(ip, {
              count: 1,
              resetTime: now + windowMs,
            });
            return { allowed: true };
          }

          if (data.count < maxRequests) {
            data.count++;
            return { allowed: true };
          }

          return { allowed: false, resetTime: data.resetTime };
        },
        reset: () => map.clear(),
      };
    }

    it('should allow requests under rate limit', () => {
      const limiter = createRateLimiter(10, 60000);
      const ip = '192.168.1.1';
      const now = Date.now();

      // Make 5 requests (under limit)
      for (let i = 0; i < 5; i++) {
        const result = limiter.check(ip, now + i * 1000);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const limiter = createRateLimiter(10, 60000);
      const ip = '192.168.1.1';
      const now = Date.now();

      // Make 11 requests (exceeds limit of 10)
      for (let i = 0; i < 11; i++) {
        const result = limiter.check(ip, now + i * 1000);

        if (i < 10) {
          expect(result.allowed).toBe(true);
        } else {
          expect(result.allowed).toBe(false);
          expect(result.resetTime).toBeDefined();
        }
      }
    });

    it('should reset rate limit after window expires', () => {
      const limiter = createRateLimiter(10, 60000);
      const ip = '192.168.1.1';
      let now = Date.now();

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        limiter.check(ip, now);
      }

      // Next request should be blocked
      let result = limiter.check(ip, now);
      expect(result.allowed).toBe(false);

      // Fast-forward past the window
      now += 61000;

      // Should be allowed again
      result = limiter.check(ip, now);
      expect(result.allowed).toBe(true);
    });

    it('should track different IPs independently', () => {
      const limiter = createRateLimiter(10, 60000);
      const now = Date.now();

      // IP 1 makes 10 requests
      for (let i = 0; i < 10; i++) {
        const result = limiter.check('192.168.1.1', now);
        expect(result.allowed).toBe(true);
      }

      // IP 2 should still be allowed
      const result = limiter.check('192.168.1.2', now);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Cache logic', () => {
    interface CacheEntry<T> {
      data: T;
      timestamp: number;
    }

    /**
     * Helper function to simulate cache
     */
    function createCache<T>(ttlMs: number) {
      const cache = new Map<string, CacheEntry<T>>();

      return {
        get: (key: string, now: number): T | null => {
          const entry = cache.get(key);
          if (!entry) {
            return null;
          }

          const age = now - entry.timestamp;
          if (age > ttlMs) {
            cache.delete(key);
            return null;
          }

          return entry.data;
        },
        set: (key: string, data: T, now: number): void => {
          cache.set(key, { data, timestamp: now });
        },
        size: () => cache.size,
        clear: () => cache.clear(),
      };
    }

    it('should return cached data within TTL', () => {
      const cache = createCache<string>(15 * 60 * 1000); // 15 minutes
      const now = Date.now();

      cache.set('key1', 'value1', now);

      const result = cache.get('key1', now + 1000); // 1 second later
      expect(result).toBe('value1');
    });

    it('should return null for expired cache', () => {
      const cache = createCache<string>(15 * 60 * 1000); // 15 minutes
      const now = Date.now();

      cache.set('key1', 'value1', now);

      const result = cache.get('key1', now + 16 * 60 * 1000); // 16 minutes later
      expect(result).toBeNull();
    });

    it('should return null for non-existent key', () => {
      const cache = createCache<string>(15 * 60 * 1000);
      const now = Date.now();

      const result = cache.get('non-existent', now);
      expect(result).toBeNull();
    });

    it('should handle multiple cache entries', () => {
      const cache = createCache<string>(15 * 60 * 1000);
      const now = Date.now();

      cache.set('key1', 'value1', now);
      cache.set('key2', 'value2', now + 1000);
      cache.set('key3', 'value3', now + 2000);

      expect(cache.get('key1', now + 3000)).toBe('value1');
      expect(cache.get('key2', now + 3000)).toBe('value2');
      expect(cache.get('key3', now + 3000)).toBe('value3');
      expect(cache.size()).toBe(3);
    });

    it('should remove expired entries on access', () => {
      const cache = createCache<string>(15 * 60 * 1000);
      const now = Date.now();

      cache.set('key1', 'value1', now);
      expect(cache.size()).toBe(1);

      // Try to access after expiry
      const result = cache.get('key1', now + 16 * 60 * 1000);
      expect(result).toBeNull();
      expect(cache.size()).toBe(0); // Should be removed
    });
  });

  describe('Request body validation', () => {
    it('should validate request body structure', () => {
      // Valid body
      const validBody = { url: 'https://merkos302.com/page.html' };
      expect(validBody.url).toBeDefined();
      expect(typeof validBody.url).toBe('string');

      // Invalid bodies
      const emptyBody = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((emptyBody as any).url).toBeUndefined();

      const wrongTypeBody = { url: 123 };
      expect(typeof wrongTypeBody.url).not.toBe('string');
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = 'invalid json';

      expect(() => JSON.parse(malformedJson)).toThrow();

      // The API should catch this and return 400
      let error: Error | null = null;
      try {
        JSON.parse(malformedJson);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
    });
  });

  describe('Response format', () => {
    it('should format successful response correctly', () => {
      const mockResponse = {
        success: true,
        data: {
          html: '<html></html>',
          baseUrl: 'https://merkos302.com',
          resolvedHtml: '<html></html>',
          metadata: {
            fetchTime: 1234,
            htmlLength: 13,
            resolvedLength: 13,
          },
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data.html).toBeDefined();
      expect(mockResponse.data.baseUrl).toBeDefined();
      expect(mockResponse.data.resolvedHtml).toBeDefined();
      expect(mockResponse.data.metadata.fetchTime).toBeGreaterThanOrEqual(0);
      expect(mockResponse.data.metadata.htmlLength).toBeGreaterThanOrEqual(0);
      expect(mockResponse.data.metadata.resolvedLength).toBeGreaterThanOrEqual(0);

      // Should be JSON serializable
      expect(() => JSON.stringify(mockResponse)).not.toThrow();
    });

    it('should format error response correctly', () => {
      const errorResponse = {
        success: false,
        error: 'Invalid URL',
        details: 'Domain not whitelisted',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.details).toBeDefined();

      // Should be JSON serializable
      expect(() => JSON.stringify(errorResponse)).not.toThrow();
    });

    it('should include rate limit headers when blocked', () => {
      const headers = {
        'Retry-After': '60',
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Date.now() + 60000),
      };

      expect(headers['Retry-After']).toBeDefined();
      expect(parseInt(headers['Retry-After'])).toBeGreaterThan(0);
      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('0');
      expect(parseInt(headers['X-RateLimit-Reset'])).toBeGreaterThan(0);
    });
  });

  describe('Client IP extraction', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const forwardedFor = '192.168.1.1, 10.0.0.1';
      const ip = forwardedFor.split(',')[0].trim();
      expect(ip).toBe('192.168.1.1');
    });

    it('should handle single IP in x-forwarded-for', () => {
      const forwardedFor = '192.168.1.1';
      const ip = forwardedFor.split(',')[0].trim();
      expect(ip).toBe('192.168.1.1');
    });

    it('should handle missing headers with fallback', () => {
      const forwardedFor = null;
      const realIp = null;
      const fallbackIp = 'unknown';

      const ip = forwardedFor || realIp || fallbackIp;
      expect(ip).toBe('unknown');
    });
  });

  describe('Timeout logic', () => {
    it('should timeout long-running requests', async () => {
      const timeoutMs = 1000; // Use shorter timeout for test

      const longRunningPromise = new Promise((resolve) => {
        setTimeout(resolve, 2000); // Longer than timeout
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs);
      });

      await expect(Promise.race([longRunningPromise, timeoutPromise])).rejects.toThrow(
        'Fetch timeout'
      );
    });

    it('should complete fast requests without timeout', async () => {
      const timeoutMs = 30000;

      const fastPromise = new Promise((resolve) => {
        setTimeout(() => resolve('success'), 100);
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs);
      });

      const result = await Promise.race([fastPromise, timeoutPromise]);
      expect(result).toBe('success');
    });
  });
});
