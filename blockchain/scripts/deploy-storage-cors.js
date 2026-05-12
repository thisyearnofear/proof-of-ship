const { execSync } = require('child_process');
const path = require('path');

console.log('Deploying Firebase Storage CORS configuration...');

try {
  const corsConfigPath = path.join(__dirname, '..', '..', 'firebase-storage-cors.json');
  
  console.log('Using CORS config from:', corsConfigPath);
  
  // Check if Firebase CLI is available
  try {
    execSync('firebase --version', { stdio: 'inherit' });
  } catch (e) {
    console.error('\nFirebase CLI not found! Please install it first:');
    console.error('npm install -g firebase-tools');
    process.exit(1);
  }
  
  // Deploy the CORS config
  execSync(`firebase storage:cors set "${corsConfigPath}"`, { stdio: 'inherit' });
  
  console.log('\n✅ Firebase Storage CORS configuration deployed successfully!');
} catch (error) {
  console.error('\n❌ Error deploying CORS configuration:', error.message);
  process.exit(1);
}
