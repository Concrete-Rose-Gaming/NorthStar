const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '..', 'build', 'index.html');
const destPath = path.join(__dirname, '..', 'index.html');

try {
  // Check if build/index.html exists
  if (!fs.existsSync(sourcePath)) {
    console.error('Error: build/index.html not found. Make sure you run "npm run build" first.');
    process.exit(1);
  }

  // Copy build/index.html to root index.html
  fs.copyFileSync(sourcePath, destPath);
  console.log('✓ Successfully synced build/index.html to index.html');
} catch (error) {
  console.error('Error syncing index.html:', error.message);
  process.exit(1);
}

