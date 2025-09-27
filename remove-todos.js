const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');
let totalRemoved = 0;
let filesModified = 0;

function removeTodoComments(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Pattern to match TODO comments in various formats
  // Preserves the line structure but removes the TODO text
  const patterns = [
    // Remove single-line TODO comments
    /\/\/\s*TODO:?.*/gi,
    // Remove multi-line TODO comments
    /\/\*\s*TODO:?[^*]*\*\//gi,
    // Remove TODO in JSX comments
    /\{\/\*\s*TODO:?[^*]*\*\/\}/gi,
  ];

  let modified = content;
  let localCount = 0;

  patterns.forEach(pattern => {
    const matches = modified.match(pattern) || [];
    localCount += matches.length;
    modified = modified.replace(pattern, '');
  });

  // Clean up empty lines left behind
  modified = modified.replace(/^\s*\n/gm, '');
  modified = modified.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (localCount > 0) {
    fs.writeFileSync(filePath, modified, 'utf8');
    console.log(`✓ Removed ${localCount} TODO comments from ${path.relative(__dirname, filePath)}`);
    totalRemoved += localCount;
    filesModified++;
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && file !== 'node_modules' && file !== 'build') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
      removeTodoComments(fullPath);
    }
  });
}

console.log('🧹 Removing TODO comments from production code...\n');
processDirectory(srcPath);
console.log(`\n✅ Complete! Removed ${totalRemoved} TODO comments from ${filesModified} files.`);