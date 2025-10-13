ב׳׳ה
# Testing Plan

## Overview

Comprehensive testing strategy for the Living with the Rebbe admin tool, covering unit, integration, E2E, and performance testing.

## Table of Contents
1. [Testing Architecture](#testing-architecture)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Performance Testing](#performance-testing)
7. [Test Data Management](#test-data-management)
8. [Continuous Integration](#continuous-integration)
9. [Coverage Requirements](#coverage-requirements)

## Testing Architecture

### Technology Stack
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Cypress**: E2E testing
- **MongoDB Memory Server**: Database testing
- **MSW (Mock Service Worker)**: API mocking
- **Supertest**: API endpoint testing

### Directory Structure
```
__tests__/
├── unit/
│   ├── scraper/
│   ├── cms/
│   └── utils/
├── integration/
│   ├── api/
│   ├── database/
│   └── workflow/
├── fixtures/
│   ├── newsletters/
│   ├── media/
│   └── responses/
└── mocks/
    ├── valu-api/
    └── cms/

cypress/
├── e2e/
├── fixtures/
└── support/
```

## Test Environment Setup

### Installation
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev cypress @cypress/code-coverage
npm install --save-dev mongodb-memory-server msw supertest
npm install --save-dev @types/jest @types/supertest
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### Test Environment Variables
```env
# .env.test
MONGODB_URI=mongodb://localhost:27017/test-living-rebbe
CHABAD_UNIVERSE_API_KEY=test_key_development_only
CHABAD_UNIVERSE_CHANNEL_ID=channel_test
ARCHIVE_BASE_URL=http://localhost:3002/mock-archive
```

## Unit Testing

### Scraper Components

#### Archive Parser Tests
```typescript
// __tests__/unit/scraper/archiveParser.test.ts
import { ArchiveParser } from '@/lib/scraper/ArchiveParser';
import { readFileSync } from 'fs';

describe('ArchiveParser', () => {
  let parser: ArchiveParser;

  beforeEach(() => {
    parser = new ArchiveParser();
  });

  describe('parseArchiveHTML', () => {
    it('should extract all newsletter links', () => {
      const html = readFileSync('__tests__/fixtures/archive.html', 'utf8');
      const newsletters = parser.parseArchiveHTML(html);

      expect(newsletters).toHaveLength(52);
      expect(newsletters[0]).toMatchObject({
        url: expect.stringMatching(/^https?:\/\//),
        title: expect.any(String),
        slug: expect.stringMatching(/^\d{4}-[\w-]+$/),
      });
    });

    it('should handle empty archive', () => {
      const newsletters = parser.parseArchiveHTML('<html></html>');
      expect(newsletters).toEqual([]);
    });

    it('should resolve relative URLs correctly', () => {
      const html = '<a href="../../Email85/nitzavim.html">Nitzavim</a>';
      const newsletters = parser.parseArchiveHTML(html, 'https://example.com/base/');

      expect(newsletters[0].url).toBe('https://example.com/Email85/nitzavim.html');
    });
  });

  describe('generateSlug', () => {
    it('should generate consistent slugs', () => {
      expect(parser.generateSlug('Parshas Nitzavim', '5785')).toBe('5785-parshas-nitzavim');
      expect(parser.generateSlug('Nitzavim-Vayeilech', '5785')).toBe('5785-nitzavim-vayeilech');
    });

    it('should handle Hebrew characters', () => {
      const slug = parser.generateSlug('פרשת נצבים', '5785');
      expect(slug).toBe('5785-nitzavim');
    });
  });
});
```

#### Media Extractor Tests
```typescript
// __tests__/unit/scraper/mediaExtractor.test.ts
describe('MediaExtractor', () => {
  it('should extract all media types', () => {
    const html = `
      <img src="image.jpg">
      <a href="document.pdf">Download</a>
      <audio src="audio.mp3"></audio>
      <iframe src="video.mp4"></iframe>
    `;

    const media = extractMedia(html);

    expect(media).toHaveLength(4);
    expect(media).toContainEqual({
      type: 'image',
      url: 'image.jpg',
      element: 'img',
    });
  });

  it('should handle Google Docs links', () => {
    const html = '<a href="https://docs.google.com/document/d/ABC123">Doc</a>';
    const media = extractMedia(html);

    expect(media[0]).toMatchObject({
      type: 'document',
      url: expect.stringContaining('docs.google.com'),
      requiresAuth: true,
    });
  });

  it('should deduplicate media URLs', () => {
    const html = `
      <img src="same.jpg">
      <img src="same.jpg">
      <a href="same.jpg">Link</a>
    `;

    const media = extractMedia(html);
    expect(media).toHaveLength(1);
  });
});
```

### CMS Client Tests
```typescript
// __tests__/unit/cms/client.test.ts
import { CMSClient } from '@/lib/cms/CMSClient';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.put('/api/v1/cms/media', (req, res, ctx) => {
    return res(ctx.json({
      success: true,
      data: {
        url: 'https://cms.example.com/media/abc123.jpg',
      },
    }));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CMSClient', () => {
  it('should upload media successfully', async () => {
    const client = new CMSClient({ apiKey: 'test_key' });
    const result = await client.uploadMedia(Buffer.from('test'), 'test.jpg');

    expect(result.url).toBe('https://cms.example.com/media/abc123.jpg');
  });

  it('should handle duplicate media', async () => {
    server.use(
      rest.put('/api/v1/cms/media', (req, res, ctx) => {
        return res(ctx.status(409), ctx.json({
          error: {
            code: 'MEDIA_DUPLICATE',
            existing: {
              url: 'https://cms.example.com/media/existing.jpg',
            },
          },
        }));
      }),
    );

    const client = new CMSClient({ apiKey: 'test_key' });
    const result = await client.uploadMedia(Buffer.from('test'), 'test.jpg');

    expect(result.isDuplicate).toBe(true);
    expect(result.url).toBe('https://cms.example.com/media/existing.jpg');
  });

  it('should retry on network errors', async () => {
    let attempts = 0;
    server.use(
      rest.put('/api/v1/cms/media', (req, res, ctx) => {
        attempts++;
        if (attempts < 3) {
          return res(ctx.status(500));
        }
        return res(ctx.json({
          success: true,
          data: { url: 'https://cms.example.com/media/retry.jpg' },
        }));
      }),
    );

    const client = new CMSClient({ apiKey: 'test_key', maxRetries: 3 });
    const result = await client.uploadMedia(Buffer.from('test'), 'test.jpg');

    expect(attempts).toBe(3);
    expect(result.url).toBe('https://cms.example.com/media/retry.jpg');
  });
});
```

### Database Model Tests
```typescript
// __tests__/unit/models/newsletter.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Newsletter } from '@/models/Newsletter';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Newsletter Model', () => {
  it('should create newsletter with required fields', async () => {
    const newsletter = await Newsletter.create({
      slug: '5785-nitzavim',
      sourceUrl: 'https://example.com/newsletter.html',
      year: 5785,
      parsha: 'nitzavim',
    });

    expect(newsletter.status).toBe('pending');
    expect(newsletter.slug).toBe('5785-nitzavim');
  });

  it('should enforce unique slug constraint', async () => {
    await Newsletter.create({
      slug: '5785-duplicate',
      sourceUrl: 'https://example.com/1.html',
    });

    await expect(Newsletter.create({
      slug: '5785-duplicate',
      sourceUrl: 'https://example.com/2.html',
    })).rejects.toThrow(/duplicate key/);
  });

  it('should track media mappings', async () => {
    const newsletter = await Newsletter.create({
      slug: '5785-test',
      sourceUrl: 'https://example.com/test.html',
      mediaMapping: [
        {
          original: 'https://old.com/image.jpg',
          cms: 'https://cms.com/media/abc123.jpg',
          uploadedAt: new Date(),
        },
      ],
    });

    expect(newsletter.mediaMapping).toHaveLength(1);
    expect(newsletter.mediaMapping[0].cms).toBe('https://cms.com/media/abc123.jpg');
  });
});
```

## Integration Testing

### API Routes
```typescript
// __tests__/integration/api/scrape.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/scrape/archive';

describe('/api/scrape/archive', () => {
  it('should fetch and parse archive', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { year: '5785' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.newsletters).toBeInstanceOf(Array);
    expect(data.year).toBe('5785');
  });

  it('should require authentication', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { year: '5785' },
      headers: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toMatchObject({
      error: 'Unauthorized',
    });
  });
});
```

### Database Operations
```typescript
// __tests__/integration/database/processing.test.ts
describe('Newsletter Processing Workflow', () => {
  it('should handle complete processing lifecycle', async () => {
    // Create session
    const session = await ProcessingSession.create({
      sessionId: 'test-session',
      startedBy: 'admin-user',
    });

    // Process newsletter
    const newsletter = await Newsletter.create({
      slug: '5785-test',
      status: 'processing',
    });

    // Simulate media upload
    await newsletter.updateOne({
      $push: {
        mediaMapping: {
          original: 'https://old.com/img.jpg',
          cms: 'https://cms.com/new.jpg',
        },
      },
    });

    // Complete processing
    await newsletter.updateOne({
      status: 'completed',
      channelPostId: 'post_123',
    });

    // Update session
    await session.updateOne({
      $inc: { processed: 1, successful: 1 },
    });

    // Verify final state
    const finalNewsletter = await Newsletter.findOne({ slug: '5785-test' });
    expect(finalNewsletter?.status).toBe('completed');
    expect(finalNewsletter?.channelPostId).toBe('post_123');
  });
});
```

### Valu API Integration
```typescript
// __tests__/integration/valu/auth.test.ts
import { render, waitFor } from '@testing-library/react';
import { ValuApiProvider } from '@arkeytyp/valu-api';

describe('Valu Authentication', () => {
  it('should detect iframe context', async () => {
    // Mock parent window
    global.parent = {
      postMessage: jest.fn(),
      location: { origin: 'https://chabaduniverse.com' },
    };

    const { getByTestId } = render(
      <ValuApiProvider>
        <div data-testid="auth-status">
          {/* Component that uses useValuAuth */}
        </div>
      </ValuApiProvider>
    );

    await waitFor(() => {
      expect(getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
  });
});
```

## End-to-End Testing

### Cypress Configuration
```javascript
// cypress.config.js
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
  env: {
    API_KEY: 'test_key_e2e',
    CHANNEL_ID: 'channel_test',
  },
});
```

### E2E Test Scenarios

#### Complete Workflow Test
```typescript
// cypress/e2e/workflow.cy.ts
describe('Newsletter Processing Workflow', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password');
    cy.visit('/admin');
  });

  it('should process newsletter from archive to channel', () => {
    // Select year
    cy.get('[data-cy=year-selector]').select('5785');
    cy.get('[data-cy=fetch-archive]').click();

    // Verify archive loaded
    cy.get('[data-cy=newsletter-list]')
      .should('be.visible')
      .find('[data-cy=newsletter-item]')
      .should('have.length.greaterThan', 0);

    // Select first unprocessed newsletter
    cy.get('[data-cy=newsletter-item]')
      .not('[data-processed=true]')
      .first()
      .click();

    // Preview newsletter
    cy.get('[data-cy=preview-modal]').should('be.visible');
    cy.get('[data-cy=preview-content]').should('contain', 'Parshas');

    // Verify media detection
    cy.get('[data-cy=media-list]')
      .find('[data-cy=media-item]')
      .should('have.length.greaterThan', 0);

    // Process newsletter
    cy.get('[data-cy=process-button]').click();

    // Monitor progress
    cy.get('[data-cy=progress-bar]', { timeout: 30000 })
      .should('have.attr', 'aria-valuenow', '100');

    // Verify success
    cy.get('[data-cy=success-message]')
      .should('be.visible')
      .and('contain', 'Successfully posted');

    // Check database update
    cy.get('[data-cy=newsletter-item]')
      .first()
      .should('have.attr', 'data-processed', 'true');
  });

  it('should handle errors gracefully', () => {
    // Simulate network error
    cy.intercept('PUT', '/api/cms/media', {
      statusCode: 500,
      body: { error: 'Server error' },
    });

    cy.get('[data-cy=newsletter-item]').first().click();
    cy.get('[data-cy=process-button]').click();

    // Verify error handling
    cy.get('[data-cy=error-message]')
      .should('be.visible')
      .and('contain', 'Failed to upload media');

    // Verify retry option
    cy.get('[data-cy=retry-button]').should('be.visible');
  });
});
```

#### Admin Interface Tests
```typescript
// cypress/e2e/admin-ui.cy.ts
describe('Admin Interface', () => {
  it('should display processing statistics', () => {
    cy.visit('/admin/dashboard');

    cy.get('[data-cy=stats-total]').should('be.visible');
    cy.get('[data-cy=stats-processed]').should('be.visible');
    cy.get('[data-cy=stats-success]').should('be.visible');
    cy.get('[data-cy=stats-failed]').should('be.visible');
  });

  it('should allow batch processing', () => {
    cy.visit('/admin');

    // Select multiple newsletters
    cy.get('[data-cy=select-all]').click();
    cy.get('[data-cy=selected-count]').should('contain', '52');

    // Start batch processing
    cy.get('[data-cy=batch-process]').click();
    cy.get('[data-cy=confirm-dialog]').should('be.visible');
    cy.get('[data-cy=confirm-button]').click();

    // Monitor batch progress
    cy.get('[data-cy=batch-progress]').should('be.visible');
  });
});
```

## Performance Testing

### Load Testing
```typescript
// __tests__/performance/load.test.ts
import { performance } from 'perf_hooks';

describe('Performance Benchmarks', () => {
  it('should process newsletter under 5 seconds', async () => {
    const start = performance.now();

    await processNewsletter({
      url: 'https://example.com/newsletter.html',
      mediaCount: 10,
    });

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(5000);
  });

  it('should handle concurrent media uploads', async () => {
    const mediaUrls = Array(20).fill(null).map((_, i) =>
      `https://example.com/media${i}.jpg`
    );

    const start = performance.now();
    await Promise.all(mediaUrls.map(url => uploadMedia(url)));
    const duration = performance.now() - start;

    // Should process 20 media files in under 30 seconds
    expect(duration).toBeLessThan(30000);
  });
});
```

### Memory Testing
```typescript
// __tests__/performance/memory.test.ts
describe('Memory Management', () => {
  it('should not leak memory during batch processing', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Process 100 newsletters
    for (let i = 0; i < 100; i++) {
      await processNewsletter({
        url: `https://example.com/newsletter${i}.html`,
      });
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be less than 100MB
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  });
});
```

## Test Data Management

### Fixtures
```typescript
// __tests__/fixtures/newsletters.ts
export const sampleNewsletters = {
  valid: {
    slug: '5785-nitzavim',
    html: readFileSync('__tests__/fixtures/newsletter-valid.html'),
    media: ['image1.jpg', 'document.pdf'],
  },
  noMedia: {
    slug: '5785-text-only',
    html: '<html><body><p>Text only content</p></body></html>',
    media: [],
  },
  hebrew: {
    slug: '5785-hebrew',
    html: readFileSync('__tests__/fixtures/newsletter-hebrew.html'),
    media: ['hebrew-image.jpg'],
  },
  malformed: {
    slug: '5785-malformed',
    html: '<html><body>Unclosed tags <p>',
    media: [],
  },
};
```

### Mock Data Factory
```typescript
// __tests__/factories/newsletter.factory.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

export const NewsletterFactory = Factory.define(() => ({
  slug: faker.helpers.slug(),
  sourceUrl: faker.internet.url(),
  year: faker.number.int({ min: 5773, max: 5785 }),
  parsha: faker.helpers.arrayElement(['nitzavim', 'vayeilech', 'haazinu']),
  status: 'pending',
  mediaMapping: [],
}));

// Usage
const newsletters = NewsletterFactory.buildList(10);
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          MONGODB_URI: mongodb://localhost:27017/test

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Run E2E tests
        run: |
          npm run build
          npm run start &
          npx wait-on http://localhost:3000
          npm run test:e2e

      - name: Upload E2E videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-videos
          path: cypress/videos
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:unit"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

## Coverage Requirements

### Minimum Coverage Thresholds
```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 85,
      "statements": 85
    },
    "lib/scraper/**": {
      "branches": 90,
      "functions": 90,
      "lines": 95,
      "statements": 95
    },
    "lib/cms/**": {
      "branches": 85,
      "functions": 85,
      "lines": 90,
      "statements": 90
    }
  }
}
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# Coverage by component
npm run test:coverage -- --collectCoverageFrom="lib/scraper/**"
```

## Test Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest __tests__/unit",
    "test:integration": "jest __tests__/integration",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:performance": "jest __tests__/performance --maxWorkers=1"
  }
}
```

## Testing Checklist

### Before Each Release
- [ ] All unit tests passing (>85% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing on staging
- [ ] Performance benchmarks met
- [ ] No memory leaks detected
- [ ] Manual testing completed
- [ ] Accessibility tests passing
- [ ] Cross-browser testing done

### Critical Test Cases
- [ ] Archive parsing with 400+ newsletters
- [ ] Media upload with large files (10MB+)
- [ ] Duplicate detection working
- [ ] Error recovery from failures
- [ ] Batch processing interruption/resume
- [ ] Hebrew content preservation
- [ ] Authentication flow in iframe
- [ ] Rate limiting handling

## Troubleshooting

### Common Test Issues

**MongoDB Connection Errors**
```bash
# Start MongoDB for testing
docker run -d -p 27017:27017 mongo:6

# Or use MongoDB Memory Server
npm install --save-dev mongodb-memory-server
```

**Cypress Timeout Issues**
```javascript
// Increase timeout for slow operations
cy.get('[data-cy=element]', { timeout: 10000 });
```

**Mock Service Worker Issues**
```javascript
// Ensure MSW is properly initialized
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
```

**Flaky Tests**
```javascript
// Add retry logic for flaky tests
jest.retryTimes(3, { logErrorsBeforeRetry: true });
```

## Documentation

### Test Documentation Standards
- Each test file should have a description comment
- Complex test logic should be documented
- Mock data should be clearly labeled
- Test utilities should have JSDoc comments

### Example Test Documentation
```typescript
/**
 * Tests for Newsletter Archive Parser
 *
 * These tests verify:
 * - Correct parsing of archive HTML structure
 * - URL resolution for relative paths
 * - Slug generation consistency
 * - Error handling for malformed HTML
 */
describe('ArchiveParser', () => {
  // Test implementation
});
```

---

**Note**: This testing plan should be reviewed and updated as the API specification is finalized and implementation progresses.