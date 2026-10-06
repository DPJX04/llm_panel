/*
 * Talks to an OpenAI-compatible model server (vllm serve) from the browser: lists its models and streams answers.
 * vLLM allows requests from any page by default; one started with a narrower --allowed-origins must include "null"
 * (what a page opened from a file reports) or "*".
 * The API key, when one is needed, is only sent with the request; it is never saved.
 */
BenchPanel.define('services/modelEndpointService', [
  'types/result', 'config/appConfig', 'utils/errorMessage', 'utils/sseDecoder',
], (result, appConfig, errorMessage, sseDecoder) => {
  'use strict';

  function headers(apiKey) {
    const all = { 'Content-Type': 'application/json' };
    if (apiKey) all.Authorization = `Bearer ${apiKey}`;
    return all;
  }

  /** One controller that aborts on the caller's signal or after the timeout, whichever comes first. */
  function withTimeout(signal, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`no reply within ${Math.round(timeoutMs / 1000)} s`)), timeoutMs);
    const onAbort = () => controller.abort(signal.reason);
    if (signal) {
      if (signal.aborted) controller.abort(signal.reason);
      else signal.addEventListener('abort', onAbort, { once: true });
    }
    return {
      signal: controller.signal,
      done: () => { clearTimeout(timer); if (signal) signal.removeEventListener('abort', onAbort); },
    };
  }

  function describeFailure(baseUrl, cause, signal) {
    if (signal && signal.aborted) return 'Stopped';
    if (cause instanceof TypeError) {
      return `Could not reach ${baseUrl}. Check the URL and that the server is running. If it is, the server may be refusing `
        + 'requests from this page: start vLLM without --allowed-origins, or include "null" in it.';
    }
    return errorMessage.toErrorMessage(cause);
  }

  async function httpError(response) {
    let detail = '';
    try {
      const body = await response.json();
      detail = (body && (body.message || (body.error && (body.error.message || body.error)))) || '';
    } catch (cause) {
      // The body was not JSON; the status line says enough.
    }
    return `Server replied ${response.status}${detail ? `: ${String(detail).slice(0, 300)}` : ''}`;
  }

  /**
   * @returns {Promise<import('../types/result').Result<Array<{ servedName: string, root: string|null, maxModelLen: number|null }>>>}
   *   root is the model the server loaded, e.g. "Qwen/Qwen3-4B-Instruct-2507"; vllm bench serve records it as model_id
   */
  async function listModels(baseUrl, apiKey) {
    const request = withTimeout(null, appConfig.evalModelListTimeoutMs);
    try {
      const response = await fetch(`${baseUrl}/models`, { headers: headers(apiKey), signal: request.signal });
      if (!response.ok) return result.fail(await httpError(response));
      const body = await response.json();
      const models = (Array.isArray(body && body.data) ? body.data : [])
        .filter((entry) => entry && typeof entry.id === 'string')
        .map((entry) => ({
          servedName: entry.id,
          root: typeof entry.root === 'string' && entry.root.trim() !== '' ? entry.root : null,
          maxModelLen: typeof entry.max_model_len === 'number' ? entry.max_model_len : null,
        }));
      return models.length > 0 ? result.ok(models) : result.fail(`${baseUrl} lists no models`);
    } catch (cause) {
      return result.fail(describeFailure(baseUrl, cause, null));
    } finally {
      request.done();
    }
  }

  /** Applies one streamed chunk to the reply being built. */
  function applyChunk(reply, chunk, now) {
    if (chunk.usage) {
      reply.inputTokens = typeof chunk.usage.prompt_tokens === 'number' ? chunk.usage.prompt_tokens : reply.inputTokens;
      reply.outputTokens = typeof chunk.usage.completion_tokens === 'number' ? chunk.usage.completion_tokens : reply.outputTokens;
    }
    const choice = Array.isArray(chunk.choices) ? chunk.choices[0] : null;
    if (!choice) return;
    const delta = choice.delta || {};
    // vLLM sends reasoning separately when started with a reasoning parser ("reasoning", or "reasoning_content" before v0.10).
    const reasoning = delta.reasoning || delta.reasoning_content || '';
    const content = typeof delta.content === 'string' ? delta.content : '';
    if (reply.firstTokenAt === null && (content || reasoning)) reply.firstTokenAt = now;
    reply.text += content;
    if (choice.finish_reason) reply.finishReason = choice.finish_reason;
  }

  /**
   * Sends one chat request and streams the reply, timing it the way vllm bench serve does.
   * @param {{ baseUrl: string, apiKey: string, servedName: string, messages: Object[], temperature: number,
   *           maxTokens: number, timeoutMs?: number, signal?: AbortSignal }} request  timeoutMs defaults to the app setting
   * @returns {Promise<import('../types/result').Result<{ text: string, ttftMs: number|null, totalMs: number,
   *   inputTokens: number|null, outputTokens: number|null, finishReason: string|null }>>}
   */
  async function streamChat(request) {
    const timed = withTimeout(request.signal, request.timeoutMs || appConfig.evalRequestTimeoutMs);
    const reply = { text: '', firstTokenAt: null, inputTokens: null, outputTokens: null, finishReason: null };
    const started = performance.now();
    try {
      const response = await fetch(`${request.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: headers(request.apiKey),
        signal: timed.signal,
        body: JSON.stringify({
          model: request.servedName,
          messages: request.messages,
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          stream: true,
          stream_options: { include_usage: true },
        }),
      });
      if (!response.ok) return result.fail(await httpError(response));
      if (!response.body) return result.fail('The server reply could not be streamed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const events = sseDecoder.createSseDecoder();
      const handle = (payloads) => payloads.forEach((payload) => {
        if (payload === '[DONE]') return;
        let chunk;
        try {
          chunk = JSON.parse(payload);
        } catch (cause) {
          return;
        }
        if (chunk && chunk.error) throw new Error(String(chunk.error.message || chunk.error));
        applyChunk(reply, chunk, performance.now());
      });
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        handle(events.push(decoder.decode(value, { stream: true })));
      }
      handle(events.push(decoder.decode()));
      handle(events.flush());
      return result.ok({
        text: reply.text,
        ttftMs: reply.firstTokenAt === null ? null : reply.firstTokenAt - started,
        totalMs: performance.now() - started,
        inputTokens: reply.inputTokens,
        outputTokens: reply.outputTokens,
        finishReason: reply.finishReason,
      });
    } catch (cause) {
      return result.fail(describeFailure(request.baseUrl, cause, request.signal));
    } finally {
      timed.done();
    }
  }

  return { listModels, streamChat };
});
