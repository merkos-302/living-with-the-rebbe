/**
 * Test script for URL fetcher
 *
 * Usage: npx tsx scripts/test-url-fetch.ts <url>
 */

import { fetchAndResolveHtml } from '../lib/fetcher/url-fetcher';

async function testFetch(url: string) {
  console.log(`\n🔄 Testing URL fetch for: ${url}\n`);

  try {
    const result = await fetchAndResolveHtml(url);

    console.log('✅ Fetch successful!');
    console.log('\nResult structure:');
    console.log({
      hasHtml: !!result.html,
      htmlLength: result.html?.length || 0,
      htmlType: typeof result.html,
      hasResolvedHtml: !!result.resolvedHtml,
      resolvedLength: result.resolvedHtml?.length || 0,
      resolvedType: typeof result.resolvedHtml,
      baseUrl: result.baseUrl,
      sourceUrl: result.sourceUrl,
      fetchedAt: result.fetchedAt,
    });

    console.log('\nHTML preview (first 500 chars):');
    console.log(result.html.substring(0, 500));

    console.log('\n✅ All properties are valid!');
  } catch (error) {
    console.error('❌ Fetch failed:');
    console.error(error);
    process.exit(1);
  }
}

// Get URL from command line or use default
const testUrl =
  process.argv[2] || 'https://merkos-living.s3.us-west-2.amazonaws.com/Email85/48KiSavo1.html';

testFetch(testUrl);
