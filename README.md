# @agentbill/sdk

OpenTelemetry-based SDK for automatic AI agent usage tracking and billing. Zero-config instrumentation for OpenAI, Anthropic, and other AI providers.

## Installation

```bash
npm install @agentbill/sdk
```

## Quick Start

```typescript
import { AgentBill } from '@agentbill/sdk';
import OpenAI from 'openai';

const agentBill = AgentBill.init({
  apiKey: 'your-agentbill-api-key',
  customerId: 'customer-123',
  baseUrl: 'https://your-instance.com',
  debug: true
});

const openai = agentBill.wrapOpenAI(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}));

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello!" }]
});
```

## Features

- ✨ Zero-config instrumentation
- 📊 Accurate token & cost tracking  
- 🔍 OpenTelemetry standard
- 🚀 Multi-provider support
- ⚡ Automatic batching
- 🎯 Rich metadata

## License

MIT