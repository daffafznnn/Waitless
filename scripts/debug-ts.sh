#!/bin/bash

echo "🚀 TypeScript Debugging Toolkit"
echo "================================"
echo ""

case "$1" in
  "check")
    echo "🔍 Running comprehensive TypeScript check..."
    npm run typecheck
    ;;
  "frontend")
    echo "📱 Checking Frontend TypeScript..."
    npm run typecheck:frontend
    ;;
  "backend")
    echo "🖥️  Checking Backend TypeScript..."
    npm run typecheck:backend
    ;;
  "vue")
    echo "🔧 Checking Vue Components TypeScript..."
    npm run typecheck:vue
    ;;
  "errors")
    echo "❌ Finding all TypeScript errors..."
    echo "Frontend errors:"
    echo "----------------"
    npx nuxt typecheck 2>&1 | grep "error TS"
    echo ""
    echo "Backend errors:"
    echo "---------------"
    npx tsc --project tsconfig.server.json --noEmit 2>&1 | grep "error TS"
    echo ""
    echo "Vue component errors:"
    echo "---------------------"
    npx vue-tsc --noEmit 2>&1 | grep "error TS"
    ;;
  "fix")
    echo "🔧 Running auto-fixes..."
    npm run fix:all
    ;;
  "watch")
    echo "👀 Watching TypeScript errors..."
    npx tsc --project tsconfig.server.json --noEmit --watch &
    npx vue-tsc --noEmit --watch
    ;;
  *)
    echo "Usage: $0 {check|frontend|backend|vue|errors|fix|watch}"
    echo ""
    echo "Commands:"
    echo "  check     - Run all TypeScript checks"
    echo "  frontend  - Check frontend (Nuxt) only"
    echo "  backend   - Check backend (Express) only"
    echo "  vue       - Check Vue components only"
    echo "  errors    - Show only error lines"
    echo "  fix       - Run auto-fixes"
    echo "  watch     - Watch for TypeScript errors"
    echo ""
    echo "Examples:"
    echo "  ./scripts/debug-ts.sh check"
    echo "  ./scripts/debug-ts.sh errors"
    echo "  ./scripts/debug-ts.sh fix"
    ;;
esac