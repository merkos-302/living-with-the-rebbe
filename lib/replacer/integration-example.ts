/**
 * Integration Example: Parser + Replacer + CMS
 *
 * This demonstrates the complete workflow from HTML parsing
 * to URL replacement in the Living with the Rebbe processing pipeline.
 *
 * Run with: tsx lib/replacer/integration-example.ts
 */

/* eslint-disable no-console */

import { parseHtml } from '../parser/html-parser';
import { replaceUrls, createUrlMap, validateUrlMap } from './url-replacer';

// Sample newsletter HTML
const SAMPLE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Living with the Rebbe - Parshat Bereshit</title>
</head>
<body>
  <div class="newsletter">
    <h1>Living with the Rebbe</h1>
    <h2>Parshat Bereshit - Week of October 14, 2023</h2>

    <section class="introduction">
      <p>Shalom! Welcome to this week's newsletter.</p>
      <p>Below you'll find this week's Torah resources.</p>
    </section>

    <section class="resources">
      <h3>This Week's Resources</h3>
      <ul>
        <li>
          <a href="https://s3.amazonaws.com/newsletters/5785/parshat-bereshit.pdf">
            Parshat Bereshit Study Guide
          </a> - Complete Torah portion with commentary
        </li>
        <li>
          <a href="https://s3.amazonaws.com/newsletters/5785/weekly-calendar.pdf">
            Weekly Calendar
          </a> - Important dates and times
        </li>
        <li>
          <a href="https://example.com/documents/shiur-notes.docx">
            Shiur Notes
          </a> - Rabbi's class notes from this week
        </li>
      </ul>
    </section>

    <section class="additional">
      <h3>Additional Resources</h3>
      <p>Visit our website for more: <a href="https://chabaduniverse.com">ChabadUniverse</a></p>
      <p>The same PDF appears here again:
        <a href="https://s3.amazonaws.com/newsletters/5785/parshat-bereshit.pdf">
          Download again
        </a>
      </p>
    </section>

    <footer>
      <p>May you have a blessed week!</p>
    </footer>
  </div>
</body>
</html>
`;

/**
 * Simulates uploading a resource to CMS and returning the CMS URL
 * In production, this would call the actual CMS API
 */
async function uploadResourceToCms(_url: string, index: number): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Generate a mock CMS URL
  const resourceId = `mock-${Date.now()}-${index}`;
  return `https://cms.chabaduniverse.com/api/resource/${resourceId}`;
}

/**
 * Main workflow demonstrating the complete processing pipeline
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Living with the Rebbe - Processing Pipeline Demo        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // ============================================================
  // STEP 1: Parse HTML to extract resources
  // ============================================================
  console.log('📋 STEP 1: Parsing HTML to extract resources...\n');

  const parseResult = parseHtml(SAMPLE_HTML, {
    baseUrl: 'https://chabaduniverse.com',
    externalOnly: true,
  });

  console.log(`✅ Found ${parseResult.resources.length} resources:`);
  parseResult.resources.forEach((resource, index) => {
    console.log(`   ${index + 1}. ${resource.url}`);
    console.log(`      Type: ${resource.type}, Extension: ${resource.extension}`);
  });

  console.log(`\n📊 Summary:`);
  console.log(`   - Total Resources: ${parseResult.summary.totalResources}`);
  console.log(`   - External Resources: ${parseResult.summary.externalResources}`);
  console.log(`   - PDFs: ${parseResult.summary.byType.pdf}`);
  console.log(`   - Documents: ${parseResult.summary.byType.document}`);
  console.log(`   - Parse Time: ${parseResult.metadata.parseTime}ms`);

  if (parseResult.errors.length > 0) {
    console.log(`\n⚠️  Errors during parsing:`);
    parseResult.errors.forEach((error) => console.log(`   - ${error.message}`));
  }

  // ============================================================
  // STEP 2: Upload resources to CMS
  // ============================================================
  console.log('\n\n📤 STEP 2: Uploading resources to CMS...\n');

  const uploadPromises = parseResult.resources.map((resource, index) =>
    uploadResourceToCms(resource.normalizedUrl, index)
  );

  const cmsUrls = await Promise.all(uploadPromises);

  console.log(`✅ Uploaded ${cmsUrls.length} resources to CMS:`);
  parseResult.resources.forEach((resource, index) => {
    console.log(`   ${index + 1}. ${resource.url}`);
    console.log(`      → ${cmsUrls[index]}`);
  });

  // ============================================================
  // STEP 3: Create URL mapping
  // ============================================================
  console.log('\n\n🗺️  STEP 3: Creating URL mapping...\n');

  const originalUrls = parseResult.resources.map((r) => r.normalizedUrl);
  const urlMap = createUrlMap(originalUrls, cmsUrls);

  console.log(`✅ Created URL map with ${urlMap.size} entries`);

  // Validate the URL map
  const validation = validateUrlMap(urlMap);
  if (validation.isValid) {
    console.log(`✅ URL map is valid`);
  } else {
    console.log(`❌ URL map validation failed:`);
    validation.errors.forEach((error) => console.log(`   - ${error}`));
    return;
  }

  // ============================================================
  // STEP 4: Replace URLs in HTML
  // ============================================================
  console.log('\n\n🔄 STEP 4: Replacing URLs in HTML...\n');

  const replaceResult = replaceUrls(SAMPLE_HTML, urlMap, {
    caseSensitive: false,
    normalizeUrls: true,
    matchQueryParams: true,
    matchFragments: false,
  });

  console.log(`✅ Replacement completed:`);
  console.log(`   - URLs Replaced: ${replaceResult.replacementCount}`);
  console.log(`   - Elements Modified: ${replaceResult.statistics.modifiedElements}`);
  console.log(`   - Processing Time: ${replaceResult.statistics.processingTime}ms`);

  if (replaceResult.unreplacedUrls.length > 0) {
    console.log(`\n⚠️  Unreplaced URLs (not found in HTML):`);
    replaceResult.unreplacedUrls.forEach((url) => console.log(`   - ${url}`));
  }

  if (replaceResult.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    replaceResult.warnings.forEach((warning) => console.log(`   - ${warning.message}`));
  }

  // ============================================================
  // STEP 5: Verify the result
  // ============================================================
  console.log('\n\n✅ STEP 5: Verifying result...\n');

  const modifiedHtml = replaceResult.html;

  // Check that all original URLs are replaced
  const originalUrlsStillPresent = originalUrls.filter((url) => modifiedHtml.includes(url));

  if (originalUrlsStillPresent.length === 0) {
    console.log(`✅ All original URLs have been replaced with CMS URLs`);
  } else {
    console.log(`❌ Some original URLs are still present:`);
    originalUrlsStillPresent.forEach((url) => console.log(`   - ${url}`));
  }

  // Check that all CMS URLs are present
  const cmsUrlsPresent = cmsUrls.filter((url) => modifiedHtml.includes(url));

  console.log(
    `✅ ${cmsUrlsPresent.length}/${cmsUrls.length} CMS URLs are present in modified HTML`
  );

  // ============================================================
  // STEP 6: Display sample of modified HTML
  // ============================================================
  console.log('\n\n📄 STEP 6: Sample of modified HTML:\n');
  console.log('─────────────────────────────────────────────────────────────');

  // Extract just the resources section for display
  const resourcesSectionMatch = modifiedHtml.match(
    /<section class="resources">[\s\S]*?<\/section>/
  );

  if (resourcesSectionMatch) {
    const resourcesSection = resourcesSectionMatch[0];
    // Show first 800 characters
    const sample =
      resourcesSection.length > 800
        ? resourcesSection.substring(0, 800) + '\n... (truncated)'
        : resourcesSection;
    console.log(sample);
  }

  console.log('─────────────────────────────────────────────────────────────');

  // ============================================================
  // Summary Statistics
  // ============================================================
  console.log('\n\n📊 FINAL SUMMARY:\n');
  console.log('Processing Pipeline Statistics:');
  console.log(`   Step 1 (Parse):   ${parseResult.metadata.parseTime}ms`);
  console.log(`   Step 2 (Upload):  ${cmsUrls.length * 100}ms (simulated)`);
  console.log(`   Step 4 (Replace): ${replaceResult.statistics.processingTime}ms`);
  console.log(
    `   Total Time:       ${parseResult.metadata.parseTime + cmsUrls.length * 100 + replaceResult.statistics.processingTime}ms\n`
  );

  console.log('Resource Statistics:');
  console.log(`   Resources Found:     ${parseResult.resources.length}`);
  console.log(`   Unique URLs:         ${replaceResult.statistics.totalMappings}`);
  console.log(`   URLs Replaced:       ${replaceResult.statistics.successfulReplacements}`);
  console.log(`   Elements Modified:   ${replaceResult.statistics.modifiedElements}`);
  console.log(
    `   Duplicate Links:     ${replaceResult.statistics.modifiedElements - replaceResult.statistics.successfulReplacements}\n`
  );

  console.log('✅ Processing pipeline completed successfully!\n');

  // ============================================================
  // Next Steps
  // ============================================================
  console.log('💡 NEXT STEPS:\n');
  console.log('   1. Admin can now copy the modified HTML');
  console.log('   2. Distribute via ChabadUniverse channels');
  console.log('   3. CMS URLs will handle authentication/redirects');
  console.log('   4. Save processing history to MongoDB (future)\n');

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Demo Complete                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Return the results for programmatic use
  return {
    parseResult,
    urlMap,
    replaceResult,
    modifiedHtml,
  };
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error running integration example:', error);
    process.exit(1);
  });
}

export { main };
