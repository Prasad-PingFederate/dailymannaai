/**
 * Daily Manna AI - API Testing Script
 * Run with: node test.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility function to print colored output
function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function printHeader(title) {
  console.log('\n' + colors.bright + colors.blue + '════════════════════════════════════' + colors.reset);
  console.log(colors.bright + colors.blue + `  ${title}` + colors.reset);
  console.log(colors.bright + colors.blue + '════════════════════════════════════' + colors.reset + '\n');
}

function printTestResult(testName, passed, details = '') {
  if (passed) {
    log(colors.green, `✓ ${testName}`);
    results.passed++;
  } else {
    log(colors.red, `✗ ${testName}`);
    if (details) {
      log(colors.red, `  └─ ${details}`);
    }
    results.failed++;
  }
}

// Test Suite
async function runTests() {
  printHeader('Daily Manna AI - API Test Suite');

  // Check if server is running
  log(colors.yellow, '⏳ Checking if server is running...\n');

  try {
    // Test 1: Health Check
    printHeader('Test 1: Health Check');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      printTestResult('Health check endpoint', response.status === 200 && response.data.status === 'OK');
      if (response.status === 200) {
        console.log(`  Response: ${JSON.stringify(response.data)}\n`);
      }
    } catch (error) {
      printTestResult('Health check endpoint', false, error.message);
      log(colors.yellow, '\n⚠️  Server might not be running. Start it with: npm start\n');
      process.exit(1);
    }

    // Test 2: Chat Endpoint
    printHeader('Test 2: Chat Endpoint');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: 'Tell me about prayer'
      });
      printTestResult('POST /api/chat', response.status === 200 && response.data.message);
      console.log(`  Request: message = "Tell me about prayer"`);
      console.log(`  Response: ${response.data.message.substring(0, 100)}...\n`);
    } catch (error) {
      printTestResult('POST /api/chat', false, error.message);
    }

    // Test 3: Chat with Session ID
    printHeader('Test 3: Chat with Session ID');
    try {
      const sessionId = 'test-session-' + Date.now();
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: 'What is faith?',
        sessionId: sessionId
      });
      printTestResult('POST /api/chat with sessionId', response.status === 200);
      console.log(`  Session ID: ${response.data.sessionId}`);
      console.log(`  Response: ${response.data.message.substring(0, 100)}...\n`);
    } catch (error) {
      printTestResult('POST /api/chat with sessionId', false, error.message);
    }

    // Test 4: Scripture Search
    printHeader('Test 4: Scripture Search');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/scripture`, {
        keyword: 'faith'
      });
      printTestResult('POST /api/scripture', response.status === 200 && response.data.results.length > 0);
      console.log(`  Keyword: faith`);
      console.log(`  Results Found: ${response.data.count}`);
      if (response.data.results.length > 0) {
        console.log(`  First Result: ${response.data.results[0].substring(0, 80)}...\n`);
      }
    } catch (error) {
      printTestResult('POST /api/scripture', false, error.message);
    }

    // Test 5: Get Voices
    printHeader('Test 5: Get Available Voices');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/voices`);
      printTestResult('GET /api/voices', response.status === 200 && response.data.voices.length > 0);
      console.log(`  Available Voices: ${response.data.voices.length}`);
      response.data.voices.forEach((voice, index) => {
        if (index < 3) console.log(`    ${index + 1}. ${voice.name}`);
      });
      if (response.data.voices.length > 3) {
        console.log(`    ... and ${response.data.voices.length - 3} more\n`);
      } else {
        console.log();
      }
    } catch (error) {
      printTestResult('GET /api/voices', false, error.message);
    }

    // Test 6: History Endpoint
    printHeader('Test 6: Conversation History');
    try {
      const sessionId = 'test-history-' + Date.now();
      
      // First, create some history
      await axios.post(`${API_BASE_URL}/api/chat`, {
        message: 'First message',
        sessionId: sessionId
      });
      
      await axios.post(`${API_BASE_URL}/api/chat`, {
        message: 'Second message',
        sessionId: sessionId
      });

      // Then retrieve it
      const response = await axios.get(`${API_BASE_URL}/api/history/${sessionId}`);
      printTestResult('GET /api/history/:sessionId', response.status === 200 && response.data.messages.length >= 2);
      console.log(`  Session ID: ${sessionId}`);
      console.log(`  Messages in History: ${response.data.count}\n`);
    } catch (error) {
      printTestResult('GET /api/history/:sessionId', false, error.message);
    }

    // Test 7: TTS Endpoint
    printHeader('Test 7: Text-to-Speech Endpoint');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/tts`, {
        text: 'Hello, this is a test of the text to speech endpoint.',
        voice: 'default',
        rate: 1
      });
      printTestResult('POST /api/tts', response.status === 200);
      console.log(`  Text: "Hello, this is a test..."`);
      console.log(`  Voice: ${response.data.voice}`);
      console.log(`  Rate: ${response.data.rate}x\n`);
    } catch (error) {
      printTestResult('POST /api/tts', false, error.message);
    }

    // Test 8: Error Handling
    printHeader('Test 8: Error Handling');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: ''  // Empty message
      });
      printTestResult('Empty message validation', false, 'Should have returned error');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        printTestResult('Empty message validation', true);
      } else {
        printTestResult('Empty message validation', false, error.message);
      }
    }
    console.log();

    // Test 9: Multiple Requests
    printHeader('Test 9: Multiple Sequential Requests');
    try {
      const questions = ['Tell me about love', 'What is grace', 'How do I pray'];
      let allSucceeded = true;

      for (let i = 0; i < questions.length; i++) {
        const response = await axios.post(`${API_BASE_URL}/api/chat`, {
          message: questions[i]
        });
        if (response.status !== 200) allSucceeded = false;
      }

      printTestResult('Multiple sequential requests', allSucceeded);
      console.log(`  Successfully processed ${questions.length} requests\n`);
    } catch (error) {
      printTestResult('Multiple sequential requests', false, error.message);
    }

    // Test 10: 404 Error
    printHeader('Test 10: 404 Error Handling');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/nonexistent`);
      printTestResult('404 error handling', false, 'Should have returned 404');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        printTestResult('404 error handling', true);
      } else {
        printTestResult('404 error handling', false, error.message);
      }
    }
    console.log();

    // Print Summary
    printHeader('Test Summary');
    log(colors.bright, `Total Tests: ${results.passed + results.failed}`);
    log(colors.green, `Passed: ${results.passed}`);
    if (results.failed > 0) {
      log(colors.red, `Failed: ${results.failed}`);
    } else {
      log(colors.green, `Failed: 0`);
    }

    const passPercentage = Math.round((results.passed / (results.passed + results.failed)) * 100);
    if (passPercentage === 100) {
      log(colors.green, `\n✓ All tests passed! ${passPercentage}%`);
    } else {
      log(colors.yellow, `\nTest Coverage: ${passPercentage}%`);
    }

    // Additional Information
    printHeader('Next Steps');
    console.log('1. Open index.html in your browser');
    console.log('2. Click the microphone button');
    console.log('3. Speak a question about scripture');
    console.log('4. Listen to the AI respond with voice\n');

    console.log(colors.bright + 'Documentation:' + colors.reset);
    console.log('- Frontend: index.html');
    console.log('- Backend: server.js');
    console.log('- Config: config.js');
    console.log('- README: README.md\n');

  } catch (error) {
    log(colors.red, `\nUnexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Run tests
runTests();
