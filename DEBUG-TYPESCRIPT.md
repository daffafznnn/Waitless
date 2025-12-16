# 🔍 TypeScript Debugging Guide

## Quick VSCode Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + M` | Open Problems Panel (see all errors) |
| `Ctrl/Cmd + Shift + P` → `TypeScript: Restart TS Server` | Restart TypeScript |
| `Ctrl/Cmd + Shift + P` → `Developer: Reload Window` | Reload VSCode |
| `Ctrl/Cmd + Shift + P` → `Tasks: Run Task` | Run custom TypeScript tasks |

## NPM Scripts

```bash
# 🔍 Check all TypeScript issues
npm run typecheck

# 📱 Check frontend only (Nuxt)
npm run typecheck:frontend

# 🖥️ Check backend only (Express)
npm run typecheck:backend

# 🔧 Check Vue components only
npm run typecheck:vue

# ✨ Check everything (TypeScript + ESLint)
npm run check:all

# 🔧 Auto-fix issues
npm run fix:all
```

## Debug Script Commands

```bash
# 🔍 Comprehensive check
./scripts/debug-ts.sh check

# ❌ Show only errors (filtered)
./scripts/debug-ts.sh errors

# 📱 Frontend check
./scripts/debug-ts.sh frontend

# 🖥️ Backend check
./scripts/debug-ts.sh backend

# 🔧 Vue components check
./scripts/debug-ts.sh vue

# 🔧 Auto-fix
./scripts/debug-ts.sh fix

# 👀 Watch mode (real-time checking)
./scripts/debug-ts.sh watch
```

## VSCode Tasks (Ctrl/Cmd + Shift + P → "Tasks: Run Task")

- 🔍 Check All TypeScript
- 📱 Check Frontend TypeScript
- 🖥️ Check Backend TypeScript
- 🔧 Check Vue Components
- ❌ Show Only Errors
- 🔧 Auto Fix Issues
- 👀 Watch TypeScript Errors

## Common Issues & Fixes

### ❌ "Cannot find name 'useAuth'"
**Fix**: Restart TypeScript Server
```bash
Ctrl/Cmd + Shift + P → "TypeScript: Restart TS Server"
```

### ❌ "Cannot find name 'ref', 'computed'"
**Fix**: Check tsconfig.json extends Nuxt config
```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

### ❌ Build failures
**Fix**: Check separate configs
```bash
# Backend build
npm run build:backend

# Frontend build
npm run build:frontend
```

## File Structure

```
project/
├── tsconfig.json              # Frontend (extends .nuxt/tsconfig.json)
├── tsconfig.server.json       # Backend (Express/Node.js)
├── scripts/
│   ├── check-ts.sh           # TypeScript checker
│   └── debug-ts.sh           # Debug toolkit
└── .vscode/
    └── tasks.json            # VSCode tasks
```

## Quick Troubleshooting

1. **Error in VSCode but build works?**
   ```bash
   Ctrl/Cmd + Shift + P → "TypeScript: Restart TS Server"
   ```

2. **Imports not recognized?**
   ```bash
   npm run typecheck:frontend
   ```

3. **Server types failing?**
   ```bash
   npm run typecheck:backend
   ```

4. **Vue component issues?**
   ```bash
   npm run typecheck:vue
   ```

5. **Want to fix everything?**
   ```bash
   npm run fix:all
   ```