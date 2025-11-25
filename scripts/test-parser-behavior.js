#!/usr/bin/env node
/**
 * Test script to demonstrate the parser's behavior with mixed content
 * Shows that only linked documents are extracted, not inline images
 */

const { parseHtml } = require('../.next/server/chunks/parser_html-parser.js');

// Sample HTML with both inline images and linked documents
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    .header {
      background-image: url('https://example.com/bg-pattern.jpg');
    }
  </style>
</head>
<body>
  <h1>Living with the Rebbe Newsletter</h1>

  <!-- Inline images - these should NOT be extracted -->
  <img src="https://example.com/header-logo.png" alt="Header Logo">
  <img src="/images/rebbe-photo.jpg" alt="The Rebbe">
  <img src="./newsletter-banner.gif" alt="Newsletter Banner">

  <!-- Linked documents - these SHOULD be extracted -->
  <p>Download this week's materials:</p>
  <a href="https://example.com/torah-portion.pdf">Torah Portion Study Guide (PDF)</a>
  <a href="/documents/weekly-lesson.pdf">Weekly Lesson (PDF)</a>
  <a href="./files/schedule.docx">Schedule (Word Document)</a>

  <!-- Linked images - these should NOT be extracted (not documents) -->
  <a href="https://example.com/photo-gallery.jpg">View Photo Gallery</a>

  <!-- Embedded media - should NOT be extracted -->
  <embed src="https://example.com/video-player.swf" />
  <object data="https://example.com/interactive-calendar.pdf"></object>
</body>
</html>
`;

console.log('Testing parser behavior with mixed content...\n');
console.log('HTML contains:');
console.log('- 3 inline images (img tags)');
console.log('- 3 linked documents (PDF/DOCX via anchor tags)');
console.log('- 1 linked image (JPG via anchor tag)');
console.log('- 1 CSS background image');
console.log('- 2 embedded media elements\n');

try {
  const result = parseHtml(testHtml, {
    baseUrl: 'https://example.com',
    externalOnly: true,
    includeBackgrounds: true,
  });

  console.log('Parser Results:');
  console.log('================');
  console.log(`Total resources extracted: ${result.resources.length}`);
  console.log(`PDFs found: ${result.byType.PDF.length}`);
  console.log(`Images found: ${result.byType.IMAGE.length}`);
  console.log(`Documents found: ${result.byType.DOCUMENT.length}`);
  console.log(`Unknown found: ${result.byType.UNKNOWN.length}\n`);

  if (result.resources.length > 0) {
    console.log('Extracted Resources:');
    result.resources.forEach((resource, index) => {
      console.log(`${index + 1}. [${resource.type}] ${resource.normalizedUrl}`);
      console.log(`   From: <${resource.element.tag}> tag`);
    });
  }

  console.log('\n✅ Expected Behavior:');
  console.log('- Only the 3 linked documents (PDFs/DOCX) should be extracted');
  console.log('- Inline images, CSS backgrounds, and embedded media should be ignored');
  console.log('- Linked images should also be ignored (not documents)');
} catch (error) {
  console.error('Error parsing HTML:', error);
}
