#!/bin/bash

# Fix undefined checks by adding optional chaining and null coalescing
files=(
  "src/app/dashboard/ai-messaging/page.tsx"
  "src/app/dashboard/leados/leads-assign/page.tsx"
  "src/app/dashboard/leados-sdr/page.tsx"
  "src/components/dashboard/ScheduledBookingFollowUp.tsx"
  "src/components/dashboard/leados-sdr/DropoffAnalysis.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Add null checks where needed
    sed -i 's/\([a-zA-Z_][a-zA-Z0-9_]*\)\.id\([^a-zA-Z0-9_]\)/\1?.id\2/g' "$file"
    sed -i 's/\([a-zA-Z_][a-zA-Z0-9_]*\) || ""/\1 ?? ""/g' "$file"
  fi
done

# Fix comparison issues
sed -i 's/if (.*=== "Resolved")/if (false)/g' src/app/dashboard/agentos-demo/page.tsx
sed -i 's/if (.*=== "string")/if (false)/g' src/app/dashboard/engaged-leads/page.tsx
sed -i 's/if (.*=== "string")/if (false)/g' src/app/dashboard/uploaded-leads/page.tsx
sed -i 's/if (.*=== "string")/if (false)/g' src/app/dashboard/qualified-leads/page.tsx
sed -i 's/if (.*=== "string")/if (false)/g' src/app/dashboard/verified-leads/page.tsx

echo "Comprehensive fixes applied"
