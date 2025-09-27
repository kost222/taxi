#!/bin/bash
# Script to clean up all console.log statements in the taxi app codebase

echo "Starting console.log cleanup..."

# Find all TypeScript/TSX files with console.log
files_with_console=$(find ./src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\.log" 2>/dev/null)

for file in $files_with_console; do
    echo "Processing: $file"

    # Check if logger is already imported
    has_logger=$(grep -c "import.*logger.*from.*utils/logger" "$file" 2>/dev/null || echo "0")

    # Add logger import if not present
    if [ "$has_logger" -eq 0 ]; then
        # Find the last import line and add logger import after it
        last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        if [ ! -z "$last_import_line" ]; then
            sed -i "${last_import_line}a\\import { logger } from '../utils/logger'" "$file" 2>/dev/null ||
            sed -i "${last_import_line}a\\import { logger } from '../../utils/logger'" "$file" 2>/dev/null ||
            sed -i "${last_import_line}a\\import { logger } from '../../../utils/logger'" "$file" 2>/dev/null
        fi
    fi

    # Replace different console.log patterns
    sed -i 's/console\.log(/logger.debug(/g' "$file" 2>/dev/null
    sed -i 's/console\.error(/logger.error(/g' "$file" 2>/dev/null
    sed -i 's/console\.warn(/logger.warn(/g' "$file" 2>/dev/null
    sed -i 's/console\.info(/logger.info(/g' "$file" 2>/dev/null
done

echo "Console.log cleanup completed!"
echo "Found and processed $(echo "$files_with_console" | wc -w) files"