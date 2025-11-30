#!/bin/bash

# Fix searchParams possibly null issues
sed -i 's/searchParams\.get/searchParams?.get/g' src/app/auth/reset-password/page.tsx
sed -i 's/searchParams\.get/searchParams?.get/g' src/app/onboarding/page.tsx

# Fix user possibly null issues
sed -i 's/user\.id/user?.id/g' src/app/dashboard/leados/leads-assign/page.tsx

# Fix params possibly null in client components
sed -i 's/params\.stage/params?.stage/g' src/app/dashboard/leads/[stage]/page.tsx

echo "Batch fixes applied"
