#!/usr/bin/env node

/**
 * Test script to verify environment variables are properly embedded
 */

// Load the built configuration
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Environment Variables in Build...\n');

// Check if the out directory exists
const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) {
  console.error('❌ Out directory not found. Run build first.');
  process.exit(1);
}

// Look for the main JS file that should contain the environment variables
const staticDir = path.join(outDir, '_next', 'static', 'chunks');
if (fs.existsSync(staticDir)) {
  const files = fs.readdirSync(staticDir);
  const appFile = files.find(file => file.includes('_app-') && file.endsWith('.js'));
  
  if (appFile) {
    const appFilePath = path.join(staticDir, appFile);
    const content = fs.readFileSync(appFilePath, 'utf8');
    
    console.log('📁 Checking built app file:', appFile);
    
    // Check for Firebase config
    const hasFirebaseApiKey = content.includes('AIzaSyDpa_XqtZXiKfGF-g17wg4dMJFukDPXw5o');
    const hasFirebaseProjectId = content.includes('proofofship');
    const hasDummyValues = content.includes('dummy-api-key') || content.includes('dummy-project');
    
    console.log('🔍 Environment Variable Check:');
    console.log(`  ✅ Firebase API Key embedded: ${hasFirebaseApiKey}`);
    console.log(`  ✅ Firebase Project ID embedded: ${hasFirebaseProjectId}`);
    console.log(`  ${hasDummyValues ? '⚠️' : '✅'} Dummy values present: ${hasDummyValues}`);
    
    if (hasFirebaseApiKey && hasFirebaseProjectId && !hasDummyValues) {
      console.log('\n🎉 SUCCESS: Environment variables are properly embedded in the build!');
    } else {
      console.log('\n⚠️  WARNING: Some environment variables may not be properly embedded.');
    }
  } else {
    console.log('❌ Could not find app bundle file to check.');
  }
} else {
  console.log('❌ Static chunks directory not found.');
}

console.log('\n📋 Summary:');
console.log('- Environment variables should now be embedded in the static build');
console.log('- Firebase configuration should work in production');
console.log('- Visit https://proofofship.web.app to test the live site');
console.log('- Check browser console for any remaining errors');
