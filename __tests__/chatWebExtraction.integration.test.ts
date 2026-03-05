import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import aiReducer, { createConversation, sendMessage } from '../src/store/slices/aiSlice';
import { aiService } from '../src/services/aiService';
import { webContentService } from '../src/services/webContentService';
import { agentConfig } from '../src/services/agent/config';

const createAiStore = () =>
  configureStore({
    reducer: {
      ai: aiReducer,
    },
  });

const setupConversation = () => {
  const store = createAiStore();
  store.dispatch(createConversation());
  const conversationId = store.getState().ai.currentConversation?.id;
  if (!conversationId) {
    throw new Error('Failed to initialize test conversation');
  }
  return { store, conversationId };
};

const latestAssistantMessage = (store: ReturnType<typeof createAiStore>) => {
  const messages = store.getState().ai.currentConversation?.messages || [];
  return messages.findLast((m) => m.role === 'assistant');
};

describe('chat integration: web extraction scenarios', () => {
  beforeEach(() => {
    agentConfig.setEnabled(true);
    agentConfig.setStage(1);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('extracts a wechat link from chat input and records OK summary metadata', async () => {
    const { store, conversationId } = setupConversation();
    const cleanUrl = 'https://mp.weixin.qq.com/s/2NdhPNQECnKSdWVIU9zgjw';
    const dirtyInput = `请总结这篇：${cleanUrl}。`;

    const extractSpy = jest.spyOn(webContentService, 'extract').mockResolvedValue({
      ok: true,
      sourceUrl: cleanUrl,
      finalUrl: cleanUrl,
      mode: 'dynamic',
      title: '微信文章',
      text: '正文内容'.repeat(80),
      excerpt: '正文内容',
    });
    jest.spyOn(aiService as any, 'dispatchToProvider').mockResolvedValue({
      content: '总结完成',
      tokens: 123,
      latency: 50,
    });

    await store.dispatch(
      sendMessage({
        conversationId,
        content: dirtyInput,
      }) as any
    );

    expect(extractSpy).toHaveBeenCalledWith(cleanUrl, expect.objectContaining({ preferDynamic: true }));
    const assistant = latestAssistantMessage(store);
    expect(assistant?.metadata?.agentWebExtractionSummary).toContain('OK(dynamic,len=');
    expect(assistant?.metadata?.agentWebExtractions?.[0]).toMatchObject({
      url: cleanUrl,
      ok: true,
      mode: 'dynamic',
    });
  });

  it('records mixed extraction results for multiple links in one chat message', async () => {
    const { store, conversationId } = setupConversation();
    const okUrl = 'https://example.com/a';
    const failUrl = 'https://example.com/b';

    jest.spyOn(webContentService, 'extract').mockImplementation(async (url: string) => {
      if (url === okUrl) {
        return {
          ok: true,
          sourceUrl: okUrl,
          finalUrl: okUrl,
          mode: 'static',
          title: 'A',
          text: 'a'.repeat(400),
          excerpt: 'a',
        };
      }
      return {
        ok: false,
        sourceUrl: failUrl,
        mode: 'static',
        title: '',
        text: '',
        excerpt: '',
        errorCode: 'NETWORK',
        message: 'network error',
      };
    });
    jest.spyOn(aiService as any, 'dispatchToProvider').mockResolvedValue({
      content: '混合结果已处理',
    });

    await store.dispatch(
      sendMessage({
        conversationId,
        content: `${okUrl} ${failUrl}`,
      }) as any
    );

    const assistant = latestAssistantMessage(store);
    expect(assistant?.metadata?.agentWebExtractionSummary).toContain('OK(static,len=400)');
    expect(assistant?.metadata?.agentWebExtractionSummary).toContain('FAIL(NETWORK)');
    expect(assistant?.metadata?.agentWebExtractions?.length).toBe(2);
  });

  it('returns BLOCKED_URL for localhost/private network link in chat', async () => {
    const { store, conversationId } = setupConversation();

    jest.spyOn(aiService as any, 'dispatchToProvider').mockResolvedValue({
      content: '该链接无法访问',
    });

    await store.dispatch(
      sendMessage({
        conversationId,
        content: 'http://localhost:3000/docs',
      }) as any
    );

    const assistant = latestAssistantMessage(store);
    expect(assistant?.metadata?.agentWebExtractionSummary).toBe('FAIL(BLOCKED_URL)');
    expect(assistant?.metadata?.agentWebExtractions?.[0]).toMatchObject({
      url: 'http://localhost:3000/docs',
      ok: false,
      errorCode: 'BLOCKED_URL',
    });
  });

  it('keeps web extraction metadata empty when chat message has no link', async () => {
    const { store, conversationId } = setupConversation();
    const extractSpy = jest.spyOn(webContentService, 'extract');

    jest.spyOn(aiService as any, 'dispatchToProvider').mockResolvedValue({
      content: '普通聊天回复',
    });

    await store.dispatch(
      sendMessage({
        conversationId,
        content: '今天帮我做个待办计划',
      }) as any
    );

    expect(extractSpy).not.toHaveBeenCalled();
    const assistant = latestAssistantMessage(store);
    expect(assistant?.metadata?.agentWebExtractionSummary).toBeUndefined();
    expect(assistant?.metadata?.agentWebExtractions).toEqual([]);
  });

  it('supports model initiated tool_call path and stores tool loop metadata', async () => {
    const { store, conversationId } = setupConversation();
    const toolUrl = 'https://news.ycombinator.com/item?id=1';

    jest.spyOn(webContentService, 'extract').mockResolvedValue({
      ok: true,
      sourceUrl: toolUrl,
      finalUrl: toolUrl,
      mode: 'static',
      title: '工具调用网页',
      text: '工具调用正文'.repeat(100),
      excerpt: '工具调用正文',
    });

    let modelCall = 0;
    jest.spyOn(aiService as any, 'dispatchToProvider').mockImplementation(async () => {
      modelCall += 1;
      if (modelCall === 1) {
        return {
          content: `<tool_call>{"name":"web.extract","arguments":{"url":"${toolUrl}"}}</tool_call>`,
        };
      }
      return {
        content: '最终回答：已基于工具提取结果总结。',
      };
    });

    await store.dispatch(
      sendMessage({
        conversationId,
        content: '请总结这个网页内容',
      }) as any
    );

    const assistant = latestAssistantMessage(store);
    expect(assistant?.metadata?.agentToolLoopUsed).toBe(true);
    expect(assistant?.metadata?.agentToolCallRaw).toContain('<tool_call>');
    expect(assistant?.metadata?.agentWebExtractionSummary).toContain('OK(static,len=');
  });

  it('does not add INVALID_URL when user link succeeded but model emits placeholder tool_call', async () => {
    const { store, conversationId } = setupConversation();
    const url = 'https://mp.weixin.qq.com/s/2NdhPNQECnKSdWVIU9zgjw';

    const extractSpy = jest.spyOn(webContentService, 'extract').mockResolvedValue({
      ok: true,
      sourceUrl: url,
      finalUrl: url,
      mode: 'dynamic',
      title: '微信文章',
      text: '正文'.repeat(200),
      excerpt: '正文',
    });

    let modelCall = 0;
    jest.spyOn(aiService as any, 'dispatchToProvider').mockImplementation(async () => {
      modelCall += 1;
      if (modelCall === 1) {
        return {
          content: '<tool_call>{"name":"web.extract","arguments":{"url":"https://..."}}</tool_call>',
        };
      }
      return {
        content: '基于已提取内容的总结',
      };
    });

    await store.dispatch(
      sendMessage({
        conversationId,
        content: url,
      }) as any
    );

    expect(extractSpy).toHaveBeenCalledTimes(1);
    const assistant = latestAssistantMessage(store);
    expect(assistant?.metadata?.agentWebExtractionSummary).toContain('OK(dynamic,len=');
    expect(assistant?.metadata?.agentWebExtractionSummary).not.toContain('FAIL(INVALID_URL)');
  });

  it('extracts at most two links from a chat message', async () => {
    const { store, conversationId } = setupConversation();
    const u1 = 'https://example.com/1';
    const u2 = 'https://example.com/2';
    const u3 = 'https://example.com/3';

    const extractSpy = jest.spyOn(webContentService, 'extract').mockResolvedValue({
      ok: true,
      sourceUrl: u1,
      finalUrl: u1,
      mode: 'static',
      title: '网页',
      text: 'x'.repeat(500),
      excerpt: 'x',
    });
    jest.spyOn(aiService as any, 'dispatchToProvider').mockResolvedValue({
      content: '已处理多个链接',
    });

    await store.dispatch(
      sendMessage({
        conversationId,
        content: `${u1} ${u2} ${u3}`,
      }) as any
    );

    expect(extractSpy).toHaveBeenCalledTimes(2);
    const assistant = latestAssistantMessage(store);
    expect(assistant?.metadata?.agentWebExtractions?.length).toBe(2);
  });

  it('handles sticky chinese suffix after url in chat message', async () => {
    const { store, conversationId } = setupConversation();
    const cleanUrl = 'https://mp.weixin.qq.com/s/2NdhPNQECnKSdWVIU9zgjw';
    const input = `${cleanUrl}这篇文章请帮我总结`;

    const extractSpy = jest.spyOn(webContentService, 'extract').mockResolvedValue({
      ok: true,
      sourceUrl: cleanUrl,
      finalUrl: cleanUrl,
      mode: 'dynamic',
      title: '微信文章',
      text: '正文'.repeat(200),
      excerpt: '正文',
    });
    jest.spyOn(aiService as any, 'dispatchToProvider').mockResolvedValue({
      content: '已总结',
    });

    await store.dispatch(
      sendMessage({
        conversationId,
        content: input,
      }) as any
    );

    expect(extractSpy).toHaveBeenCalledWith(cleanUrl, expect.any(Object));
    const assistant = latestAssistantMessage(store);
    expect(assistant?.metadata?.agentWebExtractionSummary).toContain('OK(dynamic,len=');
    expect(assistant?.metadata?.agentWebExtractionSummary).not.toContain('FAIL(INVALID_URL)');
  });
});
