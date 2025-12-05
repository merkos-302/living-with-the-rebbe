/**
 * Demo/Example usage of the URL Replacer module
 *
 * This file demonstrates how to use the URL replacer in various scenarios.
 * Run with: tsx lib/replacer/demo.ts
 */

/* eslint-disable no-console */

import {
  replaceUrls,
  createUrlMap,
  validateUrlMap,
  extractHrefUrls,
  previewReplacements,
} from './url-replacer';

// Example 1: Basic URL replacement
function basicExample() {
  console.log('\n=== EXAMPLE 1: Basic URL Replacement ===\n');

  const html = `
    <html>
      <body>
        <h1>Weekly Newsletter</h1>
        <p>Download this week's resources:</p>
        <ul>
          <li><a href="https://s3.amazonaws.com/newsletters/parshat-bereshit.pdf">Parshat Bereshit</a></li>
          <li><a href="https://s3.amazonaws.com/newsletters/study-guide.pdf">Study Guide</a></li>
        </ul>
      </body>
    </html>
  `;

  const urlMap = new Map([
    [
      'https://s3.amazonaws.com/newsletters/parshat-bereshit.pdf',
      'https://cms.chabaduniverse.com/api/resource/abc123',
    ],
    [
      'https://s3.amazonaws.com/newsletters/study-guide.pdf',
      'https://cms.chabaduniverse.com/api/resource/def456',
    ],
  ]);

  const result = replaceUrls(html, urlMap);

  console.log('Replacement Results:');
  console.log('- Replaced URLs:', result.replacementCount);
  console.log('- Modified Elements:', result.statistics.modifiedElements);
  console.log('- Processing Time:', result.statistics.processingTime + 'ms');
  console.log('\nModified HTML:');
  console.log(result.html);
}

// Example 2: Handling unreplaced URLs
function unreplacedUrlsExample() {
  console.log('\n=== EXAMPLE 2: Handling Unreplaced URLs ===\n');

  const html = `
    <a href="https://example.com/file1.pdf">File 1</a>
    <a href="https://example.com/file2.pdf">File 2</a>
  `;

  const urlMap = new Map([
    ['https://example.com/file1.pdf', 'https://cms.example.com/resource/1'],
    ['https://example.com/file2.pdf', 'https://cms.example.com/resource/2'],
    ['https://example.com/file3.pdf', 'https://cms.example.com/resource/3'], // Not in HTML
    ['https://example.com/file4.pdf', 'https://cms.example.com/resource/4'], // Not in HTML
  ]);

  const result = replaceUrls(html, urlMap);

  console.log('Statistics:');
  console.log('- Total Mappings:', result.statistics.totalMappings);
  console.log('- Successful Replacements:', result.statistics.successfulReplacements);
  console.log('- Unmatched Mappings:', result.statistics.unmatchedMappings);
  console.log('\nUnreplaced URLs:');
  result.unreplacedUrls.forEach((url) => console.log(`  - ${url}`));

  console.log('\nWarnings:');
  result.warnings.forEach((warning) => console.log(`  - ${warning.message}`));
}

// Example 3: URL normalization options
function normalizationExample() {
  console.log('\n=== EXAMPLE 3: URL Normalization ===\n');

  const html = `
    <a href="https://example.com/file.pdf?version=1#section1">Download</a>
  `;

  const urlMap = new Map([['https://example.com/file.pdf', 'https://cms.example.com/resource/1']]);

  console.log('1. Default (ignore fragments, match query params):');
  const result1 = replaceUrls(html, urlMap);
  console.log('   Replaced:', result1.replacementCount, '(query params differ)');

  console.log('\n2. Ignore query params:');
  const result2 = replaceUrls(html, urlMap, { matchQueryParams: false });
  console.log('   Replaced:', result2.replacementCount);

  console.log('\n3. Match fragments:');
  const result3 = replaceUrls(html, urlMap, { matchFragments: true });
  console.log('   Replaced:', result3.replacementCount, '(fragment differs)');

  console.log('\n4. Ignore both query params and fragments:');
  const result4 = replaceUrls(html, urlMap, {
    matchQueryParams: false,
    matchFragments: false,
  });
  console.log('   Replaced:', result4.replacementCount, '✓');
}

// Example 4: Duplicate URLs
function duplicateUrlsExample() {
  console.log('\n=== EXAMPLE 4: Duplicate URLs ===\n');

  const html = `
    <div class="downloads">
      <a href="https://example.com/file.pdf">Download (PDF)</a>
      <a href="https://example.com/file.pdf">Download (Mirror 1)</a>
      <a href="https://example.com/file.pdf">Download (Mirror 2)</a>
    </div>
  `;

  const urlMap = new Map([['https://example.com/file.pdf', 'https://cms.example.com/resource/1']]);

  const result = replaceUrls(html, urlMap);

  console.log('Results:');
  console.log('- Unique URLs Replaced:', result.replacementCount);
  console.log('- Total Elements Modified:', result.statistics.modifiedElements);
  console.log('- All 3 links now point to:', 'https://cms.example.com/resource/1');
}

// Example 5: Using helper functions
function helperFunctionsExample() {
  console.log('\n=== EXAMPLE 5: Helper Functions ===\n');

  const html = `
    <a href="https://example.com/file1.pdf">File 1</a>
    <a href="https://example.com/file2.pdf">File 2</a>
    <a href="https://example.com/file3.pdf">File 3</a>
  `;

  // Extract URLs from HTML
  console.log('1. Extract URLs:');
  const urls = extractHrefUrls(html);
  urls.forEach((url) => console.log(`   - ${url}`));

  // Create URL map from arrays
  console.log('\n2. Create URL Map:');
  const originalUrls = urls;
  const cmsUrls = [
    'https://cms.example.com/resource/1',
    'https://cms.example.com/resource/2',
    'https://cms.example.com/resource/3',
  ];
  const urlMap = createUrlMap(originalUrls, cmsUrls);
  console.log(`   Created map with ${urlMap.size} entries`);

  // Validate URL map
  console.log('\n3. Validate URL Map:');
  const validation = validateUrlMap(urlMap);
  console.log(`   Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    validation.errors.forEach((err) => console.log(`   - Error: ${err}`));
  }

  // Preview replacements
  console.log('\n4. Preview Replacements:');
  const preview = previewReplacements(html, urlMap);
  console.log(`   Total replacements: ${preview.totalReplacements}`);
  preview.matches.forEach((match) => {
    console.log(`   - ${match.originalUrl}`);
    console.log(`     → ${match.cmsUrl}`);
    console.log(`     (${match.count} occurrence${match.count > 1 ? 's' : ''})`);
  });

  // Perform actual replacement
  console.log('\n5. Perform Replacement:');
  const result = replaceUrls(html, urlMap);
  console.log(`   Replaced ${result.replacementCount} URLs successfully`);
}

// Example 6: Integration with parser
function integrationExample() {
  console.log('\n=== EXAMPLE 6: Integration Pattern ===\n');

  // Simulate parser result
  const parsedResources = [
    {
      url: 'https://s3.amazonaws.com/newsletters/file1.pdf',
      normalizedUrl: 'https://s3.amazonaws.com/newsletters/file1.pdf',
    },
    {
      url: 'https://s3.amazonaws.com/newsletters/file2.pdf',
      normalizedUrl: 'https://s3.amazonaws.com/newsletters/file2.pdf',
    },
  ];

  console.log('Step 1: Parse HTML');
  console.log(`   Found ${parsedResources.length} resources`);

  console.log('\nStep 2: Upload to CMS (simulated)');
  const cmsUrls = [
    'https://cms.chabaduniverse.com/api/resource/abc123',
    'https://cms.chabaduniverse.com/api/resource/def456',
  ];
  console.log(`   Uploaded ${cmsUrls.length} resources`);

  console.log('\nStep 3: Create URL mapping');
  const originalUrls = parsedResources.map((r) => r.normalizedUrl);
  const urlMap = createUrlMap(originalUrls, cmsUrls);
  console.log(`   Created map with ${urlMap.size} entries`);

  console.log('\nStep 4: Replace URLs in HTML');
  const html = `
    <a href="https://s3.amazonaws.com/newsletters/file1.pdf">File 1</a>
    <a href="https://s3.amazonaws.com/newsletters/file2.pdf">File 2</a>
  `;
  const result = replaceUrls(html, urlMap);
  console.log(`   Replaced ${result.replacementCount} URLs`);
  console.log(`   Processing time: ${result.statistics.processingTime}ms`);

  console.log('\nStep 5: Verify result');
  console.log('   Success:', result.unreplacedUrls.length === 0 ? '✓' : '✗');
  if (result.unreplacedUrls.length > 0) {
    console.log('   Unreplaced:', result.unreplacedUrls);
  }
}

// Example 7: Error handling
function errorHandlingExample() {
  console.log('\n=== EXAMPLE 7: Error Handling ===\n');

  // Empty HTML
  console.log('1. Empty HTML:');
  const result1 = replaceUrls('', new Map([['url', 'cms-url']]));
  console.log(`   Warnings: ${result1.warnings.length}`);
  console.log(`   Message: ${result1.warnings[0]?.message}`);

  // Empty URL map
  console.log('\n2. Empty URL Map:');
  const result2 = replaceUrls('<a href="url">Link</a>', new Map());
  console.log(`   Warnings: ${result2.warnings.length}`);
  console.log(`   Message: ${result2.warnings[0]?.message}`);

  // Invalid URL map
  console.log('\n3. Invalid URL Map:');
  const invalidMap = new Map([
    ['https://example.com/file.pdf', ''],
    ['', 'https://cms.example.com/resource/1'],
  ]);
  const validation = validateUrlMap(invalidMap);
  console.log(`   Valid: ${validation.isValid}`);
  console.log(`   Errors: ${validation.errors.length}`);
  validation.errors.forEach((err) => console.log(`   - ${err}`));

  // Malformed HTML (graceful handling)
  console.log('\n4. Malformed HTML (graceful handling):');
  const result4 = replaceUrls('<a href="url">Unclosed tag', new Map([['url', 'cms-url']]));
  console.log(`   Replaced: ${result4.replacementCount}`);
  console.log('   Result: HTML processed despite being malformed ✓');
}

// Run all examples
function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         URL Replacer Module - Demo Examples               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  basicExample();
  unreplacedUrlsExample();
  normalizationExample();
  duplicateUrlsExample();
  helperFunctionsExample();
  integrationExample();
  errorHandlingExample();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Demo Complete                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  basicExample,
  unreplacedUrlsExample,
  normalizationExample,
  duplicateUrlsExample,
  helperFunctionsExample,
  integrationExample,
  errorHandlingExample,
};
