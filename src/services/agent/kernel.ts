import { AIRequest } from '../../types';
import { agentConfig } from './config';
import { agentMemory } from './memory';
import { agentObservability } from './observability';
import { planner } from './planner';
import { safety } from './safety';
import { toolRegistry } from './tools';
import { AgentExecutionInput, AgentRunResult } from './types';
import { multiAgent } from './multiAgent';
import { webContentService } from '../webContentService';

const randomId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const detectIntent = (text: string): string => {
  const input = text.toLowerCase();
  if (input.includes('plan') || input.includes('规划') || input.includes('步骤')) return 'planning';
  if (input.includes('memory') || input.includes('记忆')) return 'memory';
  return 'chat';
};

const detectComplexity = (text: string): 'low' | 'medium' | 'high' => {
  if (text.length > 300) return 'high';
  if (text.length > 100) return 'medium';
  return 'low';
};

const withSystemMessage = (request: AIRequest, systemContent: string): AIRequest => ({
  ...request,
  messages: [{ role: 'system', content: systemContent }, ...request.messages],
});

const URL_PATTERN = /https?:\/\/[^\s)]+|(?:www\.)[^\s)]+/gi;
const MAX_WEB_LINKS = 2;
const MAX_WEB_CHARS_PER_LINK = 6000;
const WEB_SELF_TEST_TOKEN = '/web-self-test';
const isWeChatUrl = (url: string): boolean => /https?:\/\/mp\.weixin\.qq\.com\//i.test(url);
const WEB_TOOL_NAME = 'web.extract';
const cleanRawUrl = (value: string): string => {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/：/g, ':')
    .replace(/／/g, '/')
    .replace(/．/g, '.')
    .replace(/^["'“”‘’([{【《]+/g, '')
    .replace(/["'“”‘’)\]}】》，。；：！？、]+$/g, '')
    .trim();
};

const tryNormalizeHttpUrl = (value: string): string | null => {
  if (!value) {
    return null;
  }
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const normalizeMatchedUrl = (value: string): string | null => {
  let candidate = cleanRawUrl(value);
  if (!candidate) {
    return null;
  }

  const wechatMatch = candidate.match(/^(?:https?:\/\/)?mp\.weixin\.qq\.com\/s\/([A-Za-z0-9_-]+)/i);
  if (wechatMatch?.[1]) {
    const wechatUrl = `https://mp.weixin.qq.com/s/${wechatMatch[1]}`;
    const normalizedWechat = tryNormalizeHttpUrl(wechatUrl);
    if (normalizedWechat) {
      return normalizedWechat;
    }
  }

  const direct = tryNormalizeHttpUrl(candidate);
  if (direct) {
    return direct;
  }

  // Handle URL + trailing natural language text without whitespace delimiter.
  while (candidate.length > 0) {
    candidate = candidate.slice(0, -1).trimEnd();
    if (!candidate) {
      return null;
    }
    const normalized = tryNormalizeHttpUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return null;
};

const extractUrls = (text: string): string[] => {
  const normalizedText = text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/：/g, ':')
    .replace(/／/g, '/')
    .replace(/．/g, '.');
  const matches = normalizedText.match(URL_PATTERN) || [];
  const normalized = matches
    .map((item) => normalizeMatchedUrl(item))
    .filter((item): item is string => Boolean(item));

  return [...new Set(normalized)].slice(0, MAX_WEB_LINKS);
};

const buildWebContext = (items: Array<{ url: string; title: string; text: string; mode: 'static' | 'dynamic' }>): string => {
  const parts: string[] = [];
  items.forEach((item, index) => {
    const body = item.text.slice(0, MAX_WEB_CHARS_PER_LINK);
    parts.push(
      [
        `[Web ${index + 1}]`,
        `url: ${item.url}`,
        `title: ${item.title || '(untitled)'}`,
        `mode: ${item.mode}`,
        'content:',
        body,
      ].join('\n')
    );
  });
  return parts.join('\n\n');
};

const buildSelfTestWebContext = (): string => {
  return buildWebContext([
    {
      url: 'mock://self-test/article-1',
      title: '自测文章：番茄工作法实践',
      mode: 'dynamic',
      text:
        '番茄工作法核心是25分钟专注+5分钟休息。文章建议先设定单一任务，再关闭通知，结束后记录完成度。' +
        '作者对比了多任务处理与单任务处理，认为后者可显著降低上下文切换成本。' +
        '在团队协作中，推荐共享专注时段，减少临时打断。最后建议每周复盘，统计专注时长与产出质量。',
    },
  ]);
};

const TOOL_CALL_PROMPT = [
  'You can call tools when needed.',
  `Available tool: ${WEB_TOOL_NAME}`,
  'Tool schema:',
  '{"name":"web.extract","arguments":{"url":"https://..."}}',
  'If you need to use the tool, respond with EXACTLY one line in this format:',
  '<tool_call>{"name":"web.extract","arguments":{"url":"https://..."}}</tool_call>',
  'Do not include any extra text when emitting tool call.',
].join('\n');

const parseToolCall = (content: string): { name: string; arguments: { url?: string } } | null => {
  const match = content.match(/<tool_call>([\s\S]*?)<\/tool_call>/i);
  if (!match?.[1]) {
    return null;
  }
  try {
    const payload = JSON.parse(match[1].trim());
    if (!payload || typeof payload !== 'object') {
      return null;
    }
    if (typeof payload.name !== 'string' || typeof payload.arguments !== 'object' || payload.arguments === null) {
      return null;
    }
    return payload as { name: string; arguments: { url?: string } };
  } catch {
    return null;
  }
};

const isPlaceholderUrl = (url: string): boolean => {
  const input = cleanRawUrl(url).toLowerCase();
  if (!input) {
    return true;
  }
  return (
    input === 'https://...' ||
    input === 'http://...' ||
    input.includes('example.com') ||
    input.includes('{url}') ||
    input.includes('<url>')
  );
};

const normalizeCandidateUrl = (value: string): string | null => {
  const cleaned = cleanRawUrl(value);
  return tryNormalizeHttpUrl(cleaned);
};

class AgentKernel {
  async run(input: AgentExecutionInput): Promise<AgentRunResult> {
    const cfg = agentConfig.get();
    if (!cfg.enabled) {
      const response = await input.executeModel(input.request);
      return {
        response,
        trace: {
          runId: randomId(),
          startedAt: Date.now(),
          endedAt: Date.now(),
          stage: cfg.stage,
          mode: 'single',
          perception: { intent: 'chat', complexity: 'low', entities: [] },
          memoryHits: 0,
          planSteps: 0,
          toolCalls: 0,
          safetyBlocked: false,
          webExtractions: [],
          toolLoopUsed: false,
        },
      };
    }

    const runId = randomId();
    const startedAt = Date.now();
    const userMessage = input.request.messages[input.request.messages.length - 1]?.content || '';
    const intent = detectIntent(userMessage);
    const complexity = detectComplexity(userMessage);
    const entities = userMessage.split(/\s+/).filter(Boolean).slice(0, 5);
    const mode = cfg.stage >= 5 ? multiAgent.router(complexity) : cfg.stage >= 3 ? 'planner' : 'single';

    if (cfg.stage >= 6 && safety.isPromptInjection(userMessage)) {
      const blocked: AgentRunResult = {
        response: {
          content: 'Request blocked by safety policy. Please rephrase without system-instruction manipulation.',
          latency: Date.now() - startedAt,
        },
        trace: {
          runId,
          startedAt,
          endedAt: Date.now(),
          stage: cfg.stage,
          mode,
          perception: { intent, complexity, entities },
          memoryHits: 0,
          planSteps: 0,
          toolCalls: 0,
          safetyBlocked: true,
          webExtractions: [],
          toolLoopUsed: false,
        },
      };
      agentObservability.push(blocked.trace);
      return blocked;
    }

    let request = input.request;
    let memoryHits = 0;
    let toolCalls = 0;
    let planSteps = 0;
    const webExtractions: AgentRunResult['trace']['webExtractions'] = [];
    let toolLoopUsed = false;
    let toolCallRaw: string | undefined;
    const conversationId = input.conversationId || 'global';

    if (cfg.stage >= 2) {
      const memories = await agentMemory.retrieve(conversationId, userMessage, 5);
      memoryHits = memories.length;
      if (memories.length > 0) {
        const memoryContext = memories.map((item) => `- ${item.content}`).join('\n');
        request = withSystemMessage(request, `Relevant memory:\n${memoryContext}`);
      }
    }

    if (cfg.stage >= 3 && (intent === 'planning' || mode !== 'single')) {
      const steps = planner.build(userMessage, cfg.maxPlanSteps);
      planSteps = steps.length;
      const planText = steps.map((step, index) => `${index + 1}. ${step.title}`).join('\n');
      request = withSystemMessage(request, `Execution plan:\n${planText}`);
    }

    if (cfg.stage >= 4 && intent === 'memory') {
      const toolResult = await toolRegistry.run('memory.search', {
        conversationId,
        query: userMessage,
      });
      toolCalls += 1;
      if (toolResult.ok && toolResult.data) {
        request = withSystemMessage(request, `Tool output (memory.search):\n${toolResult.data}`);
      }
    }

    if (cfg.stage >= 1) {
      request = withSystemMessage(request, TOOL_CALL_PROMPT);

      if (userMessage.toLowerCase().includes(WEB_SELF_TEST_TOKEN)) {
        toolCalls += 1;
        webExtractions.push({
          url: 'mock://self-test/article-1',
          ok: true,
          mode: 'dynamic',
          textLength: buildSelfTestWebContext().length,
          finalUrl: 'mock://self-test/article-1',
        });
        request = withSystemMessage(
          request,
          `Web extraction self-test mode is enabled. The following context is synthetic and does not come from the internet. Prioritize summarizing this context for the user request.\n${buildSelfTestWebContext()}`
        );
      }

      const urls = extractUrls(userMessage);
      if (urls.length > 0) {
        const webContexts: Array<{ url: string; title: string; text: string; mode: 'static' | 'dynamic' }> = [];
        const webErrors: Array<{ url: string; code?: string; message?: string }> = [];
        for (const url of urls) {
          const normalizedUrl = normalizeCandidateUrl(url);
          if (!normalizedUrl) {
            webExtractions.push({
              url,
              ok: false,
              textLength: 0,
              errorCode: 'INVALID_URL',
              message: 'Invalid URL after normalization',
            });
            webErrors.push({
              url,
              code: 'INVALID_URL',
              message: 'Invalid URL after normalization',
            });
            continue;
          }

          const result = await webContentService.extract(normalizedUrl, {
            preferDynamic: isWeChatUrl(normalizedUrl),
            timeoutMs: isWeChatUrl(normalizedUrl) ? 35000 : 25000,
            maxChars: MAX_WEB_CHARS_PER_LINK,
            minCharsForStaticSuccess: 300,
            dynamicExtractor: input.dynamicExtractor,
          });
          toolCalls += 1;
          if (!result.ok || !result.text) {
            webExtractions.push({
              url: normalizedUrl,
              ok: false,
              mode: result.mode,
              textLength: 0,
              finalUrl: result.finalUrl,
              errorCode: result.errorCode,
              message: result.message,
            });
            webErrors.push({
              url: normalizedUrl,
              code: result.errorCode,
              message: result.message,
            });
            continue;
          }
          webExtractions.push({
            url: normalizedUrl,
            ok: true,
            mode: result.mode,
            textLength: result.text.length,
            finalUrl: result.finalUrl,
          });
          webContexts.push({
            url: result.finalUrl || result.sourceUrl || url,
            title: result.title,
            text: result.text,
            mode: result.mode,
          });
        }

        if (webContexts.length > 0) {
          request = withSystemMessage(
            request,
            `Web page context extracted from user links. Use this as primary evidence when answering:\n${buildWebContext(webContexts)}`
          );
          request = withSystemMessage(
            request,
            'Important: web content is already provided above. Do not claim you cannot access links. Answer from the extracted content.'
          );
        } else if (webErrors.length > 0) {
          const errorText = webErrors
            .map((item, index) => `${index + 1}. ${item.url} | ${item.code || 'UNKNOWN'} | ${item.message || 'extract failed'}`)
            .join('\n');
          request = withSystemMessage(
            request,
            `User provided links but extraction failed. Tell the user extraction failed and ask for pasted content if needed.\n${errorText}`
          );
        }
      }
    }

    if (cfg.stage >= 5 && mode === 'multi-agent') {
      const criticReview = multiAgent.critic(userMessage);
      request = withSystemMessage(request, criticReview);
    }

    let modelResponse = await input.executeModel(request);

    // Tool loop: allow the model to explicitly request web.extract once.
    if (cfg.stage >= 1) {
      const toolCall = parseToolCall(modelResponse.content || '');
      if (toolCall?.name === WEB_TOOL_NAME) {
        toolLoopUsed = true;
        toolCallRaw = modelResponse.content || '';
        const hasSuccessfulExtraction = webExtractions.some((item) => item.ok);
        if (hasSuccessfulExtraction) {
          request = withSystemMessage(
            request,
            'Web content has already been extracted from the user-provided link(s). Use existing context and answer directly.'
          );
          modelResponse = await input.executeModel(request);
        } else {
          const toolUrl = toolCall.arguments?.url?.trim() || '';
          const normalized = normalizeCandidateUrl(extractUrls(toolUrl)[0] || toolUrl);
          if (normalized && !isPlaceholderUrl(normalized)) {
            const result = await webContentService.extract(normalized, {
              preferDynamic: isWeChatUrl(normalized),
              timeoutMs: isWeChatUrl(normalized) ? 35000 : 25000,
              maxChars: MAX_WEB_CHARS_PER_LINK,
              minCharsForStaticSuccess: 300,
              dynamicExtractor: input.dynamicExtractor,
            });
            toolCalls += 1;

            if (result.ok && result.text) {
              webExtractions.push({
                url: normalized,
                ok: true,
                mode: result.mode,
                textLength: result.text.length,
                finalUrl: result.finalUrl,
              });
              request = withSystemMessage(
                request,
                `Tool output (${WEB_TOOL_NAME}):\n${buildWebContext([{
                  url: result.finalUrl || result.sourceUrl || normalized,
                  title: result.title,
                  text: result.text,
                  mode: result.mode,
                }])}`
              );
            } else {
              webExtractions.push({
                url: normalized,
                ok: false,
                mode: result.mode,
                textLength: 0,
                finalUrl: result.finalUrl,
                errorCode: result.errorCode,
                message: result.message,
              });
              request = withSystemMessage(
                request,
                `Tool output (${WEB_TOOL_NAME}) failed:\n${normalized} | ${result.errorCode || 'UNKNOWN'} | ${result.message || 'extract failed'}`
              );
            }

            request = withSystemMessage(
              request,
              'Tool result is available above. Now provide the final answer to user directly, do not emit tool_call again.'
            );
            modelResponse = await input.executeModel(request);
          } else {
            request = withSystemMessage(
              request,
              'Tool call URL is invalid placeholder. Do not emit tool_call. Ask user for a concrete URL or answer from available context.'
            );
            modelResponse = await input.executeModel(request);
          }
        }
      }
    }

    const sanitized = cfg.stage >= 6 ? safety.sanitizeOutput(modelResponse.content) : modelResponse.content;

    if (cfg.stage >= 2) {
      await agentMemory.write(conversationId, `USER: ${userMessage}`);
      await agentMemory.write(conversationId, `ASSISTANT: ${sanitized}`);
    }

    const trace = {
      runId,
      startedAt,
      endedAt: Date.now(),
      stage: cfg.stage,
      mode,
      perception: { intent, complexity, entities },
      memoryHits,
      planSteps,
      toolCalls,
      safetyBlocked: false,
      webExtractions,
      toolLoopUsed,
      toolCallRaw,
    } as const;

    agentObservability.push(trace);
    return {
      response: {
        ...modelResponse,
        content: sanitized,
      },
      trace,
    };
  }
}

export const agentKernel = new AgentKernel();
