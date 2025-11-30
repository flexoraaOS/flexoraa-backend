#!/bin/bash

# Fix line endings in all TypeScript files
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\r$//'

# Fix Redux toolkit generic type issues
sed -i 's/.from<[^>]*>(\([^)]*\))/.from(\1)/g' src/lib/features/contactsSlice.ts
sed -i 's/.from<[^>]*>(\([^)]*\))/.from(\1)/g' src/lib/features/conversationSlice.tsx

echo "Type fixes applied"
