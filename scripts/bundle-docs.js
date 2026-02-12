/**
 * Bundle markdown documents into platform/data/docs/
 * Run from platform/: node scripts/bundle-docs.js
 */
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.resolve(__dirname, '..', '..');
const TARGET_DIR = path.resolve(__dirname, '..', 'data', 'docs');

// Ensure target directory exists
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Copy all numbered .md files
const files = fs.readdirSync(SOURCE_DIR)
  .filter(f => /^\d{2}_.*\.md$/.test(f))
  .sort();

for (const file of files) {
  const src = path.join(SOURCE_DIR, file);
  const dest = path.join(TARGET_DIR, file);
  fs.copyFileSync(src, dest);
  console.log(`  Copied: ${file}`);
}

console.log(`\nBundled ${files.length} documents into data/docs/`);
