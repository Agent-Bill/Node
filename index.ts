// AgentBill SDK - Main Entry Point
export { AgentBillWrapper } from './wrapper';
export { AgentBillTracer } from './tracer';
export * from './types';

import { AgentBillWrapper } from './wrapper';
import type { AgentBillConfig } from './types';

/**
 * Initialize AgentBill SDK
 * 
 * @example
 * ```typescript
 * import { AgentBill } from '@/lib/agentbill-sdk';
 * import OpenAI from 'openai';
 * 
 * // Initialize with your API key
 * const agentBill = AgentBill.init({
 *   apiKey: 'your-api-key',
 *   customerId: 'customer-123',
 *   debug: true
 * });
 * 
 * // Wrap your OpenAI client
 * const openai = agentBill.wrapOpenAI(new OpenAI({
 *   apiKey: process.env.OPENAI_API_KEY
 * }));
 * 
 * // Use normally - all calls are automatically tracked!
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [{ role: "user", content: "Hello!" }]
 * });
 * ```
 */
export class AgentBill {
  private wrapper: AgentBillWrapper;

  private constructor(config: AgentBillConfig) {
    this.wrapper = new AgentBillWrapper(config);
  }

  /**
   * Initialize AgentBill SDK
   */
  static init(config: AgentBillConfig): AgentBill {
    return new AgentBill(config);
  }

  /**
   * Wrap an OpenAI client to automatically track usage
   */
  wrapOpenAI<T extends object>(client: T): T {
    return this.wrapper.wrapOpenAI(client);
  }

  /**
   * Wrap an Anthropic client to automatically track usage
   */
  wrapAnthropic<T extends object>(client: T): T {
    return this.wrapper.wrapAnthropic(client);
  }

  /**
   * Flush any pending telemetry data
   */
  async flush(): Promise<void> {
    await this.wrapper.flush();
  }
}

// Export default instance
export default AgentBill;