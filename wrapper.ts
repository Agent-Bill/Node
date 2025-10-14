// AI SDK Wrapper with OpenTelemetry Instrumentation
import { AgentBillTracer } from './tracer';
import { AgentBillConfig, TraceContext } from './types';

export class AgentBillWrapper {
  private tracer: AgentBillTracer;
  private config: AgentBillConfig;

  constructor(config: AgentBillConfig) {
    this.config = config;
    this.tracer = new AgentBillTracer(config);
  }

  /**
   * Wrap an OpenAI client instance
   */
  wrapOpenAI<T extends object>(client: T): T {
    const self = this;

    return new Proxy(client, {
      get(target: any, prop: string | symbol) {
        const original = target[prop];

        // Intercept chat.completions.create
        if (prop === 'chat') {
          return new Proxy(original, {
            get(chatTarget: any, chatProp: string | symbol) {
              if (chatProp === 'completions') {
                return new Proxy(chatTarget[chatProp], {
                  get(completionsTarget: any, completionsProp: string | symbol) {
                    if (completionsProp === 'create') {
                      return async function(params: any) {
                        return self.instrumentOpenAICall(
                          completionsTarget[completionsProp].bind(completionsTarget),
                          params,
                          'openai.chat.completions.create'
                        );
                      };
                    }
                    return completionsTarget[completionsProp];
                  }
                });
              }
              return chatTarget[chatProp];
            }
          });
        }

        // Intercept embeddings.create
        if (prop === 'embeddings') {
          return new Proxy(original, {
            get(embeddingsTarget: any, embeddingsProp: string | symbol) {
              if (embeddingsProp === 'create') {
                return async function(params: any) {
                  return self.instrumentOpenAICall(
                    embeddingsTarget[embeddingsProp].bind(embeddingsTarget),
                    params,
                    'openai.embeddings.create'
                  );
                };
              }
              return embeddingsTarget[embeddingsProp];
            }
          });
        }

        // Intercept images.generate
        if (prop === 'images') {
          return new Proxy(original, {
            get(imagesTarget: any, imagesProp: string | symbol) {
              if (imagesProp === 'generate') {
                return async function(params: any) {
                  return self.instrumentOpenAICall(
                    imagesTarget[imagesProp].bind(imagesTarget),
                    params,
                    'openai.images.generate'
                  );
                };
              }
              return imagesTarget[imagesProp];
            }
          });
        }

        // Intercept audio.transcriptions.create and audio.speech.create
        if (prop === 'audio') {
          return new Proxy(original, {
            get(audioTarget: any, audioProp: string | symbol) {
              if (audioProp === 'transcriptions') {
                return new Proxy(audioTarget[audioProp], {
                  get(transcriptionsTarget: any, transcriptionsProp: string | symbol) {
                    if (transcriptionsProp === 'create') {
                      return async function(params: any) {
                        return self.instrumentOpenAICall(
                          transcriptionsTarget[transcriptionsProp].bind(transcriptionsTarget),
                          params,
                          'openai.audio.transcriptions.create'
                        );
                      };
                    }
                    return transcriptionsTarget[transcriptionsProp];
                  }
                });
              }
              if (audioProp === 'speech') {
                return new Proxy(audioTarget[audioProp], {
                  get(speechTarget: any, speechProp: string | symbol) {
                    if (speechProp === 'create') {
                      return async function(params: any) {
                        return self.instrumentOpenAICall(
                          speechTarget[speechProp].bind(speechTarget),
                          params,
                          'openai.audio.speech.create'
                        );
                      };
                    }
                    return speechTarget[speechProp];
                  }
                });
              }
              return audioTarget[audioProp];
            }
          });
        }

        // Intercept moderations.create
        if (prop === 'moderations') {
          return new Proxy(original, {
            get(moderationsTarget: any, moderationsProp: string | symbol) {
              if (moderationsProp === 'create') {
                return async function(params: any) {
                  return self.instrumentOpenAICall(
                    moderationsTarget[moderationsProp].bind(moderationsTarget),
                    params,
                    'openai.moderations.create'
                  );
                };
              }
              return moderationsTarget[moderationsProp];
            }
          });
        }

        return original;
      }
    });
  }

  /**
   * Track custom signal/event with optional revenue
   */
  async trackSignal(eventName: string, revenue: number = 0, data: Record<string, any> = {}) {
    try {
      const baseUrl = this.config.baseUrl || window.location.origin;
      const response = await fetch(`${baseUrl}/functions/v1/record-signals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_name: eventName,
          revenue,
          customer_id: this.config.customerId,
          timestamp: Math.floor(Date.now() / 1000),
          data,
        }),
      });

      if (this.config.debug) {
        console.log(`[AgentBill] Signal tracked: ${eventName}, revenue: $${revenue}`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[AgentBill] Failed to track signal:', error);
      }
    }
  }

  private async instrumentOpenAICall(originalFn: Function, params: any, spanName: string) {
    const traceContext = this.tracer.startSpan(spanName);
    const startTime = Date.now();

    try {
      // Set span attributes
      this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.system', 'openai');
      this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.request.model', params.model || 'unknown');
      this.tracer.setSpanAttribute(traceContext.spanId, 'ai.provider', 'openai');
      this.tracer.setSpanAttribute(traceContext.spanId, 'ai.model', params.model || 'unknown');

      if (params.temperature !== undefined) {
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.request.temperature', params.temperature);
      }
      if (params.max_tokens !== undefined) {
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.request.max_tokens', params.max_tokens);
      }

      // Execute the original API call
      const response = await originalFn(params);

      // Calculate latency
      const latencyMs = Date.now() - startTime;
      this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.response.latency_ms', latencyMs);

      // Extract token usage from response
      if (response.usage) {
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.usage.prompt_tokens', response.usage.prompt_tokens || 0);
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.usage.completion_tokens', response.usage.completion_tokens || 0);
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.usage.total_tokens', response.usage.total_tokens || 0);
        this.tracer.setSpanAttribute(traceContext.spanId, 'ai.prompt_tokens', response.usage.prompt_tokens || 0);
        this.tracer.setSpanAttribute(traceContext.spanId, 'ai.completion_tokens', response.usage.completion_tokens || 0);
        this.tracer.setSpanAttribute(traceContext.spanId, 'ai.total_tokens', response.usage.total_tokens || 0);
      }

      // Set success status
      this.tracer.setSpanStatus(traceContext.spanId, 0); // 0 = OK
      this.tracer.endSpan(traceContext.spanId);

      return response;
    } catch (error) {
      // Set error status
      this.tracer.setSpanStatus(traceContext.spanId, 2, error instanceof Error ? error.message : 'Unknown error');
      this.tracer.setSpanAttribute(traceContext.spanId, 'error', true);
      this.tracer.setSpanAttribute(traceContext.spanId, 'error.message', error instanceof Error ? error.message : String(error));
      this.tracer.endSpan(traceContext.spanId);
      throw error;
    }
  }

  /**
   * Wrap an Anthropic client instance
   */
  wrapAnthropic<T extends object>(client: T): T {
    const self = this;

    return new Proxy(client, {
      get(target: any, prop: string | symbol) {
        const original = target[prop];

        // Intercept messages.create
        if (prop === 'messages') {
          return new Proxy(original, {
            get(messagesTarget: any, messagesProp: string | symbol) {
              if (messagesProp === 'create') {
                return async function(params: any) {
                  return self.instrumentAnthropicCall(
                    messagesTarget[messagesProp].bind(messagesTarget),
                    params
                  );
                };
              }
              return messagesTarget[messagesProp];
            }
          });
        }

        return original;
      }
    });
  }

  private async instrumentAnthropicCall(originalFn: Function, params: any) {
    const traceContext = this.tracer.startSpan('anthropic.messages.create');
    const startTime = Date.now();

    try {
      // Set span attributes
      this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.system', 'anthropic');
      this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.request.model', params.model || 'unknown');
      this.tracer.setSpanAttribute(traceContext.spanId, 'ai.provider', 'anthropic');
      this.tracer.setSpanAttribute(traceContext.spanId, 'ai.model', params.model || 'unknown');

      if (params.temperature !== undefined) {
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.request.temperature', params.temperature);
      }
      if (params.max_tokens !== undefined) {
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.request.max_tokens', params.max_tokens);
      }

      // Execute the original API call
      const response = await originalFn(params);

      // Calculate latency
      const latencyMs = Date.now() - startTime;
      this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.response.latency_ms', latencyMs);

      // Extract token usage from response
      if (response.usage) {
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.usage.prompt_tokens', response.usage.input_tokens || 0);
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.usage.completion_tokens', response.usage.output_tokens || 0);
        this.tracer.setSpanAttribute(traceContext.spanId, 'gen_ai.usage.total_tokens', (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0));
        this.tracer.setSpanAttribute(traceContext.spanId, 'ai.prompt_tokens', response.usage.input_tokens || 0);
        this.tracer.setSpanAttribute(traceContext.spanId, 'ai.completion_tokens', response.usage.output_tokens || 0);
        this.tracer.setSpanAttribute(traceContext.spanId, 'ai.total_tokens', (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0));
      }

      // Set success status
      this.tracer.setSpanStatus(traceContext.spanId, 0);
      this.tracer.endSpan(traceContext.spanId);

      return response;
    } catch (error) {
      // Set error status
      this.tracer.setSpanStatus(traceContext.spanId, 2, error instanceof Error ? error.message : 'Unknown error');
      this.tracer.setSpanAttribute(traceContext.spanId, 'error', true);
      this.tracer.setSpanAttribute(traceContext.spanId, 'error.message', error instanceof Error ? error.message : String(error));
      this.tracer.endSpan(traceContext.spanId);
      throw error;
    }
  }

  async flush() {
    await this.tracer.flush();
  }
}