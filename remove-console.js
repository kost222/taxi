const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');
let totalRemoved = 0;
let filesModified = 0;

// Files to exclude from console.log removal
const excludeFiles = [
  'logger.ts',
  'production-logger.ts',
  'serviceWorker.js' // Standard CRA file
];

function removeConsoleStatements(filePath) {
  // Skip excluded files
  const fileName = path.basename(filePath);
  if (excludeFiles.includes(fileName)) {
    console.log(`Skipping ${fileName} (excluded file)`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Pattern to match console.log, console.error, console.warn, console.debug, console.info
  // But preserve them if they're in comments
  const patterns = [
    // Remove standalone console statements
    /^\s*console\.(log|error|warn|debug|info)\([^)]*\);?\s*$/gm,
    // Remove console statements in code blocks (not in comments)
    /(?<!\/\/.*)\bconsole\.(log|error|warn|debug|info)\([^)]*\);?/g
  ];

  let modified = content;
  let localCount = 0;

  patterns.forEach(pattern => {
    const matches = modified.match(pattern) || [];
    localCount += matches.length;
    modified = modified.replace(pattern, (match, offset) => {
      // Check if this is inside a comment
      const beforeMatch = modified.substring(0, offset);
      const lastCommentStart = beforeMatch.lastIndexOf('//');
      const lastNewLine = beforeMatch.lastIndexOf('\n');

      if (lastCommentStart > lastNewLine) {
        // This is inside a comment, don't remove
        return match;
      }

      // Remove the console statement
      return '';
    });
  });

  // Clean up empty lines left behind
  modified = modified.replace(/^\s*\n/gm, '');
  modified = modified.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (localCount > 0) {
    fs.writeFileSync(filePath, modified, 'utf8');
    console.log(`✓ Removed ${localCount} console statements from ${path.relative(__dirname, filePath)}`);
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
      removeConsoleStatements(fullPath);
    }
  });
}

console.log('🧹 Removing console statements from production code...\n');
processDirectory(srcPath);
console.log(`\n✅ Complete! Removed ${totalRemoved} console statements from ${filesModified} files.`);