/**
 * Demo/Example of HTML Parser Usage
 * This file demonstrates how to use the parser with real-world newsletter HTML
 */

/* eslint-disable no-console */

import {
  parseHtml,
  ResourceType,
  extractResourceUrls,
  hasExternalResources,
  getResourceSummary,
} from './index';

/**
 * Example newsletter HTML with various resource types
 */
const SAMPLE_NEWSLETTER_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .header {
      background-image: url('https://merkos.org/images/header-bg.jpg');
    }
    .section {
      background: url("https://merkos.org/images/section-divider.png") no-repeat;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://merkos.org/images/logo.png" alt="Living with the Rebbe" />
  </div>

  <div class="content">
    <h1>Parshas Vayeira - Week of Cheshvan 15</h1>

    <img src="https://merkos.org/photos/rebbe-teaching.jpg"
         alt="The Rebbe teaching"
         title="The Rebbe at a Farbrengen" />

    <p>Study this week's Torah portion with the following resources:</p>

    <ul>
      <li><a href="https://merkos.org/pdfs/parsha-vayeira.pdf">Complete Torah Portion (PDF)</a></li>
      <li><a href="https://merkos.org/docs/study-guide.docx">Study Guide (Word Document)</a></li>
      <li><a href="https://merkos.org/spreadsheets/weekly-schedule.xlsx">Weekly Schedule (Excel)</a></li>
    </ul>

    <div style="background-image: url('https://merkos.org/images/quote-bg.jpg')">
      <blockquote>A teaching from the Rebbe...</blockquote>
    </div>

    <picture>
      <source srcset="https://merkos.org/images/responsive-large.jpg" media="(min-width: 800px)" />
      <source src="https://merkos.org/images/responsive-medium.jpg" />
      <img src="https://merkos.org/images/responsive-small.jpg" alt="Responsive image" />
    </picture>

    <object data="https://merkos.org/pdfs/embedded-document.pdf" type="application/pdf"></object>

    <embed src="https://merkos.org/pdfs/another-teaching.pdf" type="application/pdf" />
  </div>

  <footer>
    <p>Contact us at info@merkos.org</p>
    <a href="https://merkos.org">Visit our website</a>
  </footer>
</body>
</html>
`;

/**
 * Demo 1: Basic parsing
 */
export function demoBasicParsing() {
  console.log('=== Demo 1: Basic HTML Parsing ===\n');

  const result = parseHtml(SAMPLE_NEWSLETTER_HTML);

  console.log(`Total resources found: ${result.summary.totalResources}`);
  console.log(`External resources: ${result.summary.externalResources}`);
  console.log(`Parse time: ${result.metadata.parseTime}ms`);
  console.log(`HTML length: ${result.metadata.htmlLength} bytes\n`);

  console.log('Resources by type:');
  console.log(`  - PDFs: ${result.summary.byType[ResourceType.PDF]}`);
  console.log(`  - Images: ${result.summary.byType[ResourceType.IMAGE]}`);
  console.log(`  - Documents: ${result.summary.byType[ResourceType.DOCUMENT]}`);
  console.log(`  - Unknown: ${result.summary.byType[ResourceType.UNKNOWN]}\n`);

  if (result.errors.length > 0) {
    console.log('Errors encountered:');
    result.errors.forEach((error) => {
      console.log(`  - ${error.message}`);
    });
  }

  console.log('\n');
}

/**
 * Demo 2: Listing all resources with details
 */
export function demoResourceListing() {
  console.log('=== Demo 2: Detailed Resource Listing ===\n');

  const result = parseHtml(SAMPLE_NEWSLETTER_HTML);

  console.log('PDF Documents:');
  result.byType[ResourceType.PDF].forEach((resource, index) => {
    console.log(`  ${index + 1}. ${resource.normalizedUrl}`);
    console.log(`     Element: <${resource.element.tag}>`);
    console.log(`     Attribute: ${resource.element.attribute}`);
    if (resource.context?.title) {
      console.log(`     Title: ${resource.context.title}`);
    }
  });

  console.log('\nImages:');
  result.byType[ResourceType.IMAGE].forEach((resource, index) => {
    console.log(`  ${index + 1}. ${resource.normalizedUrl}`);
    if (resource.context?.altText) {
      console.log(`     Alt text: ${resource.context.altText}`);
    }
  });

  console.log('\nDocuments:');
  result.byType[ResourceType.DOCUMENT].forEach((resource, index) => {
    console.log(`  ${index + 1}. ${resource.normalizedUrl}`);
    console.log(`     Extension: ${resource.extension}`);
  });

  console.log('\n');
}

/**
 * Demo 3: Quick helpers
 */
export function demoQuickHelpers() {
  console.log('=== Demo 3: Quick Helper Functions ===\n');

  // Check if HTML has external resources
  const hasExternal = hasExternalResources(SAMPLE_NEWSLETTER_HTML);
  console.log(`Has external resources: ${hasExternal}`);

  // Get quick summary
  const summary = getResourceSummary(SAMPLE_NEWSLETTER_HTML);
  console.log(`\nQuick summary:`);
  console.log(`  Total: ${summary.total}`);
  console.log(`  External: ${summary.external}`);
  console.log(`  Images: ${summary.byType[ResourceType.IMAGE]}`);
  console.log(`  PDFs: ${summary.byType[ResourceType.PDF]}`);
  console.log(`  Documents: ${summary.byType[ResourceType.DOCUMENT]}`);

  // Get all URLs
  const urls = extractResourceUrls(SAMPLE_NEWSLETTER_HTML);
  console.log(`\nAll resource URLs (${urls.length} total):`);
  urls.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });

  console.log('\n');
}

/**
 * Demo 4: Processing for CMS upload
 */
export function demoCMSProcessing() {
  console.log('=== Demo 4: Processing for CMS Upload ===\n');

  const result = parseHtml(SAMPLE_NEWSLETTER_HTML, {
    externalOnly: true,
    includeBackgrounds: true,
  });

  console.log('Resources to upload to CMS:\n');

  // Group by type for organized processing
  const types = [ResourceType.PDF, ResourceType.IMAGE, ResourceType.DOCUMENT];

  types.forEach((type) => {
    const resources = result.byType[type];
    if (resources.length > 0) {
      console.log(`${type.toUpperCase()} (${resources.length} files):`);
      resources.forEach((resource) => {
        console.log(`  - ${resource.normalizedUrl}`);
        console.log(`    Extension: ${resource.extension}`);
        console.log(`    Found in: <${resource.element.tag}> ${resource.element.attribute}`);
      });
      console.log('');
    }
  });

  console.log('Next steps:');
  console.log('1. Download each resource from its original URL');
  console.log('2. Upload to ChabadUniverse CMS');
  console.log('3. Create URL mapping (original -> CMS URL)');
  console.log('4. Replace all URLs in HTML');
  console.log('5. Return processed HTML\n');
}

/**
 * Demo 5: Handling relative URLs
 */
export function demoRelativeUrls() {
  console.log('=== Demo 5: Handling Relative URLs ===\n');

  const htmlWithRelative = `
    <html>
      <body>
        <img src="/images/photo.jpg" />
        <img src="assets/logo.png" />
        <img src="https://external.com/image.jpg" />
        <a href="../docs/file.pdf">PDF</a>
      </body>
    </html>
  `;

  console.log('With base URL and externalOnly=false:');
  const result1 = parseHtml(htmlWithRelative, {
    baseUrl: 'https://merkos.org/newsletter',
    externalOnly: false,
  });

  result1.resources.forEach((resource) => {
    console.log(`  ${resource.url} -> ${resource.normalizedUrl}`);
  });

  console.log('\nWith externalOnly=true (default):');
  const result2 = parseHtml(htmlWithRelative, {
    baseUrl: 'https://merkos.org/newsletter',
    externalOnly: true,
  });

  result2.resources.forEach((resource) => {
    console.log(`  ${resource.normalizedUrl}`);
  });

  console.log('\n');
}

/**
 * Demo 6: Error handling
 */
export function demoErrorHandling() {
  console.log('=== Demo 6: Error Handling ===\n');

  const problematicHtml = `
    <html>
      <body>
        <img src="" />
        <img src="https://example.com/${'a'.repeat(3000)}.jpg" />
        <a href="not a valid url">Link</a>
        <img src="data:image/png;base64,ABC123" />
      </body>
    </html>
  `;

  const result = parseHtml(problematicHtml);

  console.log(`Resources found: ${result.summary.totalResources}`);
  console.log(`Errors encountered: ${result.errors.length}\n`);

  if (result.errors.length > 0) {
    console.log('Error details:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. [${error.type}] ${error.message}`);
      if (error.context?.url) {
        console.log(`     URL: ${error.context.url.substring(0, 100)}...`);
      }
    });
  }

  console.log('\n');
}

/**
 * Run all demos
 */
export function runAllDemos() {
  console.log('\n');
  console.log('========================================');
  console.log('HTML Parser Demonstrations');
  console.log('========================================\n');

  demoBasicParsing();
  demoResourceListing();
  demoQuickHelpers();
  demoCMSProcessing();
  demoRelativeUrls();
  demoErrorHandling();

  console.log('========================================');
  console.log('Demos Complete');
  console.log('========================================\n');
}

// Allow running demos directly
if (require.main === module) {
  runAllDemos();
}
