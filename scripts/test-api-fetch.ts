/**
 * Test script for API fetch endpoint
 *
 * Usage: npm run dev (in another terminal), then npx tsx scripts/test-api-fetch.ts <url>
 */

import axios from 'axios';

async function testApiFetch(url: string) {
  console.log(`\n🔄 Testing API fetch for: ${url}\n`);

  const port = process.env.PORT || '3002';
  const apiUrl = `http://localhost:${port}/api/fetch-html`;

  try {
    const response = await axios.post(
      apiUrl,
      { url },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    console.log('✅ API call successful!');
    console.log('\nResponse status:', response.status);
    console.log('\nResponse data structure:');
    console.log({
      success: response.data.success,
      hasData: !!response.data.data,
      dataKeys: response.data.data ? Object.keys(response.data.data) : [],
    });

    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('\nData details:');
      console.log({
        hasHtml: !!data.html,
        htmlLength: data.html?.length || 0,
        htmlType: typeof data.html,
        hasResolvedHtml: !!data.resolvedHtml,
        resolvedLength: data.resolvedHtml?.length || 0,
        resolvedType: typeof data.resolvedHtml,
        baseUrl: data.baseUrl,
        metadata: data.metadata,
      });

      console.log('\n✅ API endpoint working correctly!');
    } else {
      console.error('❌ API returned error:', response.data);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ API call failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
    process.exit(1);
  }
}

// Get URL from command line or use default
const testUrl =
  process.argv[2] || 'https://merkos-living.s3.us-west-2.amazonaws.com/Email85/48KiSavo1.html';

testApiFetch(testUrl);
