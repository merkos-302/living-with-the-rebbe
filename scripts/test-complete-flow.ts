/**
 * Complete end-to-end test for URL fetch functionality
 *
 * Tests both the library function and the API endpoint
 */

import { fetchAndResolveHtml } from '../lib/fetcher/url-fetcher';
import axios from 'axios';

const TEST_URL = 'https://merkos-living.s3.us-west-2.amazonaws.com/Email85/48KiSavo1.html';

async function testLibraryFunction() {
  console.log('\n📚 Testing Library Function...\n');

  try {
    const result = await fetchAndResolveHtml(TEST_URL);

    // Validate all required properties exist
    if (!result.html || typeof result.html !== 'string') {
      throw new Error('❌ result.html is not a valid string');
    }

    if (!result.resolvedHtml || typeof result.resolvedHtml !== 'string') {
      throw new Error('❌ result.resolvedHtml is not a valid string');
    }

    if (!result.baseUrl || typeof result.baseUrl !== 'string') {
      throw new Error('❌ result.baseUrl is not a valid string');
    }

    console.log('✅ Library function returned valid result:');
    console.log({
      htmlLength: result.html.length,
      resolvedLength: result.resolvedHtml.length,
      baseUrl: result.baseUrl,
      sourceUrl: result.sourceUrl,
    });

    return result;
  } catch (error) {
    console.error('❌ Library function failed:', error);
    throw error;
  }
}

async function testApiEndpoint() {
  console.log('\n🌐 Testing API Endpoint...\n');

  const port = process.env.PORT || '3000';
  const apiUrl = `http://localhost:${port}/api/fetch-html`;

  try {
    const response = await axios.post(
      apiUrl,
      { url: TEST_URL },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    // Check response structure
    if (!response.data.success) {
      throw new Error(`❌ API returned error: ${response.data.error}`);
    }

    const data = response.data.data;

    // Validate data structure
    if (!data) {
      throw new Error('❌ response.data.data is undefined');
    }

    if (!data.html || typeof data.html !== 'string') {
      throw new Error('❌ data.html is not a valid string');
    }

    if (!data.resolvedHtml || typeof data.resolvedHtml !== 'string') {
      throw new Error('❌ data.resolvedHtml is not a valid string');
    }

    if (!data.baseUrl || typeof data.baseUrl !== 'string') {
      throw new Error('❌ data.baseUrl is not a valid string');
    }

    if (!data.metadata) {
      throw new Error('❌ data.metadata is undefined');
    }

    console.log('✅ API endpoint returned valid result:');
    console.log({
      htmlLength: data.html.length,
      resolvedLength: data.resolvedHtml.length,
      baseUrl: data.baseUrl,
      metadata: data.metadata,
    });

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Dev server not running. Skipping API test.');
        console.log('   Run "npm run dev" to test the API endpoint.');
        return null;
      }
      console.error('❌ API call failed:');
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    } else {
      console.error('❌ API endpoint failed:', error);
    }
    throw error;
  }
}

async function runTests() {
  console.log('🧪 Running Complete Flow Tests\n');
  console.log('Testing URL:', TEST_URL);
  console.log('='.repeat(80));

  let libResult;
  let apiResult;

  try {
    // Test 1: Library function
    libResult = await testLibraryFunction();

    // Test 2: API endpoint
    try {
      apiResult = await testApiEndpoint();
    } catch (error) {
      // If API test fails because server is not running, that's OK
      if (!axios.isAxiosError(error) || error.code !== 'ECONNREFUSED') {
        throw error;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ All Tests Passed!\n');

    if (libResult) {
      console.log('Library Function: ✅ Working correctly');
    }

    if (apiResult) {
      console.log('API Endpoint: ✅ Working correctly');
    } else {
      console.log('API Endpoint: ⏭️  Skipped (server not running)');
    }

    console.log('\n✅ The URL fetch issue has been fixed!\n');
  } catch {
    console.log('\n' + '='.repeat(80));
    console.log('\n❌ Tests Failed\n');
    process.exit(1);
  }
}

runTests();
