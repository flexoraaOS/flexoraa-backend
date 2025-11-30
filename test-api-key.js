// Quick test to verify API key is being read correctly
console.log('Testing API Key Configuration...\n');

const API_KEY = process.env.FLEXORAA_API_KEY || 'your-api-key-here';

console.log('API_KEY from environment:', API_KEY);
console.log('Is default value?', API_KEY === 'your-api-key-here');

if (API_KEY === 'your-api-key-here') {
    console.log('\n❌ PROBLEM FOUND: API key is using default value!');
    console.log('\nSOLUTION:');
    console.log('1. The test script needs to read from frontend/.env.local');
    console.log('2. Node.js does NOT automatically load .env files');
    console.log('3. You have TWO options:\n');

    console.log('OPTION A - Set environment variable before running:');
    console.log('   Windows CMD:');
    console.log('   set FLEXORAA_API_KEY=flexoraa_test_key_2024_secure_random_string && node test-meta-webhook.js\n');
    console.log('   Windows PowerShell:');
    console.log('   $env:FLEXORAA_API_KEY="flexoraa_test_key_2024_secure_random_string"; node test-meta-webhook.js\n');

    console.log('OPTION B - Install dotenv and load .env file:');
    console.log('   1. npm install dotenv');
    console.log('   2. Add to top of test-meta-webhook.js:');
    console.log('      require("dotenv").config({ path: "./frontend/.env.local" });\n');
} else {
    console.log('\n✅ API key is loaded correctly!');
    console.log('The issue might be something else. Check:');
    console.log('1. Is your Next.js server running?');
    console.log('2. Did you restart it after adding FLEXORAA_API_KEY?');
    console.log('3. Are the Meta API credentials valid?');
}
