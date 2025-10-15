# GitHub Repository Setup Guide

Upload the SDK files to GitHub and users can install with one command:

```bash
npm install git+https://github.com/Agent-Bill/Node.git
```

## How It Works

The SDK auto-builds during installation using the `prepare` script:

```json
{
  "scripts": {
    "prepare": "npm run build"
  },
  "dependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

When someone runs `npm install git+...`, npm automatically installs tsup/typescript, then runs the prepare script to build the SDK.

## Setup Steps

1. **Upload these files to GitHub (Agent-Bill/Node):**
   - index.ts, wrapper.ts, tracer.ts, types.ts
   - package.json, tsconfig.json, tsup.config.ts
   - README.md, LICENSE, .gitignore

2. **That's it!** Users can now run:
   ```bash
   npm install git+https://github.com/Agent-Bill/Node.git
   ```

## What Happens During Install

1. npm clones the repository
2. npm installs dependencies (tsup, typescript)
3. npm runs `prepare` script → builds TypeScript
4. SDK is ready to use

## Testing

```bash
npm install git+https://github.com/Agent-Bill/Node.git
# Should install and build successfully
```
