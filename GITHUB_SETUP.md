# GitHub Repository Setup Guide

This guide explains how to set up the AgentBill SDK repository on GitHub so users can install it directly with:

```bash
npm install git+https://github.com/Agent-Bill/Node.git
```

## How It Works

The SDK uses a **"prepare" script** in package.json that automatically builds the package when installed from GitHub:

```json
{
  "scripts": {
    "build": "tsup",
    "prepare": "npm run build",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Key Points:**
- `tsup` and `typescript` are in `dependencies` (not `devDependencies`) so they're available during installation
- The `prepare` script runs automatically after `npm install`
- It builds the TypeScript source → creates the `dist/` folder
- No need to commit the `dist/` folder to Git!

## Required Files in GitHub Repository

Upload these files to Agent-Bill/Node:

```
Agent-Bill/Node/
├── index.ts          # Main SDK entry point
├── wrapper.ts        # OpenAI/Anthropic wrappers
├── tracer.ts         # OpenTelemetry tracer
├── types.ts          # TypeScript types
├── package.json      # Package config with "prepare" script
├── tsconfig.json     # TypeScript compiler config
├── tsup.config.ts    # Build tool config
├── README.md         # Installation & usage docs
├── LICENSE           # MIT license
└── .gitignore        # Ignore node_modules/ and dist/
```

## Installation Process

When users run `npm install git+https://github.com/Agent-Bill/Node.git`:

1. npm clones the repository
2. npm runs `npm install` (installs tsup & typescript)
3. npm runs the `prepare` script automatically
4. tsup builds TypeScript → creates `dist/` folder
5. Package is ready to use!

## Testing the Installation

```bash
mkdir test-install
cd test-install
npm init -y
npm install git+https://github.com/Agent-Bill/Node.git

# Verify it installed
npm list agentbill-sdk
# Should show: @agentbill/sdk@1.0.0
```

## Troubleshooting

### "Cannot find module '@agentbill/sdk'"
- Check that `tsup` and `typescript` are in `dependencies` (not `devDependencies`)
- Verify `package.json` has the `"prepare"` script
- Ensure both `tsconfig.json` and `tsup.config.ts` exist

### Build Fails During Install
- **"Cannot find module 'tsup'"**: Move tsup to `dependencies`
- **"Cannot find module 'typescript'"**: Move typescript to `dependencies`
- **TypeScript errors**: Fix the source code errors

## Download Complete Package

Visit the AgentBill dashboard → Developers → SDKs → Download Node.js SDK to get all required files in one ZIP.
