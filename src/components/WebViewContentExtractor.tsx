/**
 * 隐藏 WebView 动态提取器
 * 用于处理依赖 JS 渲染的网页正文抓取。
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { DynamicExtractRequest, DynamicExtractResult } from '@services/webContentService';

interface InternalRequest extends DynamicExtractRequest {
  resolve: (value: DynamicExtractResult) => void;
  reject: (reason?: unknown) => void;
}

export interface WebViewContentExtractorRef {
  extract: (request: DynamicExtractRequest) => Promise<DynamicExtractResult>;
}

const buildInjectedScript = (maxChars: number, maxWaitMs: number) => `
  (function() {
    function cleanText(raw) {
      if (!raw) return '';
      return raw.replace(/\\u00A0/g, ' ').replace(/[ \\t]+/g, ' ').replace(/\\n{3,}/g, '\\n\\n').trim();
    }

    function tryExpandWeChat() {
      var selectors = [
        '#js_read_area3',
        '.js_show_more_link',
        '.weui-loadmore',
        '.more_read',
        '[class*="more"]',
      ];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && typeof el.click === 'function') {
          try { el.click(); } catch (e) {}
        }
      }
    }

    function pickMainNode() {
      var candidates = [
        '#js_content',
        '.rich_media_content',
        '#img-content',
        'article',
        'main',
        '[role="main"]',
        'body'
      ];

      var best = null;
      var bestLen = 0;
      for (var i = 0; i < candidates.length; i++) {
        var node = document.querySelector(candidates[i]);
        if (!node) continue;
        var len = cleanText(node.innerText || '').length;
        if (len > bestLen) {
          best = node;
          bestLen = len;
        }
      }
      return best || document.body;
    }

    var startedAt = Date.now();
    var stableCount = 0;
    var lastLength = 0;
    var isWeChat = /mp\\.weixin\\.qq\\.com$/i.test(window.location.hostname || '');

    function postResult() {
      var node = pickMainNode();
      var text = cleanText((node && node.innerText) || document.body.innerText || '');
      var payload = {
        type: 'result',
        title: document.title || '',
        text: text.slice(0, ${maxChars}),
        finalUrl: window.location.href || '',
        debug: {
          host: window.location.hostname || '',
          textLength: text.length
        }
      };
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }

    function tick() {
      if (isWeChat) {
        tryExpandWeChat();
      }
      var node = pickMainNode();
      var text = cleanText((node && node.innerText) || document.body.innerText || '');
      var len = text.length;
      if (len === lastLength) {
        stableCount += 1;
      } else {
        stableCount = 0;
      }
      lastLength = len;

      if ((len > 300 && stableCount >= 3) || Date.now() - startedAt > ${maxWaitMs}) {
        clearInterval(timer);
        postResult();
      }
    }

    var timer = setInterval(tick, 500);
    setTimeout(function() {
      clearInterval(timer);
      postResult();
    }, ${maxWaitMs} + 500);
  })();
  true;
`;

export const WebViewContentExtractor = forwardRef<WebViewContentExtractorRef>((_, ref) => {
  const [currentRequest, setCurrentRequest] = useState<InternalRequest | null>(null);
  const queueRef = useRef<InternalRequest[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeoutRef = useCallback(() => {
    if (!timeoutRef.current) {
      return;
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const startNext = useCallback(() => {
    if (currentRequest || queueRef.current.length === 0) {
      return;
    }

    const next = queueRef.current.shift()!;
    setCurrentRequest(next);
    timeoutRef.current = setTimeout(() => {
      next.reject(new Error('Dynamic extraction timeout'));
      setCurrentRequest(null);
    }, next.timeoutMs + 1500);
  }, [currentRequest]);

  const finishCurrent = useCallback(() => {
    clearTimeoutRef();
    setCurrentRequest(null);
  }, [clearTimeoutRef]);

  useImperativeHandle(ref, () => ({
    extract: (request: DynamicExtractRequest) =>
      new Promise<DynamicExtractResult>((resolve, reject) => {
        queueRef.current.push({ ...request, resolve, reject });
        startNext();
      }),
  }), [startNext]);

  useEffect(() => {
    if (!currentRequest) {
      startNext();
    }
  }, [currentRequest, startNext]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    if (!currentRequest) {
      return;
    }
    try {
      const payload = JSON.parse(event.nativeEvent.data || '{}');
      if (payload.type !== 'result') {
        return;
      }
      currentRequest.resolve({
        title: String(payload.title || ''),
        text: String(payload.text || ''),
        finalUrl: String(payload.finalUrl || ''),
      });
    } catch (error) {
      currentRequest.reject(error);
    } finally {
      finishCurrent();
    }
  }, [currentRequest, finishCurrent]);

  const handleError = useCallback((error: any) => {
    if (!currentRequest) {
      return;
    }
    currentRequest.reject(new Error(error?.nativeEvent?.description || 'WebView load failed'));
    finishCurrent();
  }, [currentRequest, finishCurrent]);

  if (!currentRequest) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.hidden}>
      <WebView
        originWhitelist={['*']}
        source={{ uri: currentRequest.url }}
        userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.49"
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        javaScriptCanOpenWindowsAutomatically
        onMessage={handleMessage}
        onError={handleError}
        injectedJavaScript={buildInjectedScript(currentRequest.maxChars, currentRequest.timeoutMs)}
      />
    </View>
  );
});

WebViewContentExtractor.displayName = 'WebViewContentExtractor';

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: -1000,
    left: -1000,
  },
});
