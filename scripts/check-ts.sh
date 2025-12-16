#!/bin/bash

echo "🔍 Checking TypeScript errors across the project..."
echo "=================================================="

# Check Frontend TypeScript (Nuxt)
echo "📱 Frontend (Nuxt) TypeScript Check:"
echo "------------------------------------"
npx nuxt typecheck

echo ""
echo "🖥️  Backend TypeScript Check:"
echo "------------------------------"
npx tsc --project tsconfig.server.json --noEmit

echo ""
echo "🔧 Vue Component TypeScript Check:"
echo "-----------------------------------"
npx vue-tsc --noEmit

echo ""
echo "✅ TypeScript check complete!"