// backend/test-auth.js
// Script untuk testing authentication endpoints

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';
let authToken = null;

async function testPublicEndpoint() {
  console.log('\n🧪 Testing Public Endpoint (GET /api/readings)...');
  try {
    const response = await fetch(`${API_URL}/api/readings`);
    const data = await response.json();
    console.log('✅ Public endpoint accessible');
    console.log('Response:', data.slice(0, 2)); // Show first 2 items
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function testProtectedWithoutAuth() {
  console.log('\n🧪 Testing Protected Endpoint WITHOUT Auth (POST /api/thresholds)...');
  try {
    const response = await fetch(`${API_URL}/api/thresholds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: 30, note: 'Test without auth' }),
    });
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly blocked (401 Unauthorized)');
      console.log('Response:', data);
    } else {
      console.log('❌ Should have been blocked!');
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function testProtectedWithAuth(token) {
  console.log('\n🧪 Testing Protected Endpoint WITH Auth (POST /api/thresholds)...');
  try {
    const response = await fetch(`${API_URL}/api/thresholds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ value: 32, note: 'Test with valid auth' }),
    });
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully created with auth');
      console.log('Response:', data);
    } else {
      console.log('❌ Failed with auth');
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function testInvalidToken() {
  console.log('\n🧪 Testing with Invalid Token...');
  try {
    const response = await fetch(`${API_URL}/api/thresholds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token_12345',
      },
      body: JSON.stringify({ value: 31, note: 'Test with invalid token' }),
    });
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctly rejected invalid token');
      console.log('Response:', data);
    } else {
      console.log('❌ Should have rejected invalid token!');
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Authentication Tests...');
  console.log('API URL:', API_URL);
  console.log('='.repeat(50));

  // Test 1: Public endpoint should work
  await testPublicEndpoint();

  // Test 2: Protected endpoint should block without auth
  await testProtectedWithoutAuth();

  // Test 3: Protected endpoint should block with invalid token
  await testInvalidToken();

  // Test 4: Protected endpoint should work with valid token
  console.log('\n📝 Note: To test with valid token:');
  console.log('1. Login through the mobile app');
  console.log('2. Get the token from AsyncStorage or Supabase');
  console.log('3. Run: node test-auth.js YOUR_TOKEN_HERE');
  
  if (process.argv[2]) {
    authToken = process.argv[2];
    console.log('\n✅ Token provided, testing authenticated request...');
    await testProtectedWithAuth(authToken);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests completed!\n');
}

// Run tests
runTests().catch(console.error);