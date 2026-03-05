/**
 * 网页内容提取服务（纯 App 内）
 * 先静态抓取，低质量时自动切换到动态渲染提取。
 */

export type WebExtractMode = 'static' | 'dynamic';
export type WebExtractErrorCode = 'INVALID_URL' | 'BLOCKED_URL' | 'NETWORK' | 'TIMEOUT' | 'EMPTY_CONTENT' | 'UNKNOWN';

export interface DynamicExtractResult {
  title: string;
  text: string;
  finalUrl?: string;
}

export interface DynamicExtractRequest {
  url: string;
  timeoutMs: number;
  maxChars: number;
}

export type DynamicExtractor = (request: DynamicExtractRequest) => Promise<DynamicExtractResult>;

export interface ExtractWebContentOptions {
  preferDynamic?: boolean;
  timeoutMs?: number;
  maxChars?: number;
  minCharsForStaticSuccess?: number;
  dynamicExtractor?: DynamicExtractor;
}

export interface ExtractWebContentResult {
  ok: boolean;
  sourceUrl: string;
  finalUrl?: string;
  mode: WebExtractMode;
  title: string;
  text: string;
  excerpt: string;
  errorCode?: WebExtractErrorCode;
  message?: string;
}

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_MAX_CHARS = 30000;
const DEFAULT_MIN_CHARS_FOR_STATIC_SUCCESS = 800;

class WebContentService {
  async extract(url: string, options: ExtractWebContentOptions = {}): Promise<ExtractWebContentResult> {
    const sourceUrl = this.normalizeUrl(url);
    if (!sourceUrl) {
      return this.buildError('INVALID_URL', 'URL 格式不正确');
    }
    if (this.isBlockedUrl(sourceUrl)) {
      return this.buildError('BLOCKED_URL', '当前 URL 不允许访问');
    }

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
    const minChars = options.minCharsForStaticSuccess ?? DEFAULT_MIN_CHARS_FOR_STATIC_SUCCESS;
    const dynamicExtractor = options.dynamicExtractor;
    const preferDynamic = options.preferDynamic === true;

    if (preferDynamic && dynamicExtractor) {
      const dynamicFirst = await this.tryDynamic(sourceUrl, dynamicExtractor, timeoutMs, maxChars);
      if (dynamicFirst.ok) {
        return dynamicFirst;
      }
    }

    const staticResult = await this.tryStatic(sourceUrl, timeoutMs, maxChars);
    if (staticResult.ok && this.isGoodEnough(staticResult.text, minChars)) {
      return staticResult;
    }

    if (dynamicExtractor) {
      const dynamicResult = await this.tryDynamic(sourceUrl, dynamicExtractor, timeoutMs, maxChars);
      if (dynamicResult.ok) {
        return dynamicResult;
      }
      if (staticResult.ok) {
        return staticResult;
      }
      return dynamicResult;
    }

    return staticResult.ok
      ? staticResult
      : this.buildError('EMPTY_CONTENT', '未提取到有效正文内容', sourceUrl, 'static');
  }

  private async tryStatic(url: string, timeoutMs: number, maxChars: number): Promise<ExtractWebContentResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (Mobile; ReactNative) WebContentExtractor/1.0',
        },
      });
      if (!response.ok) {
        return this.buildError('NETWORK', `页面请求失败: HTTP ${response.status}`, url, 'static');
      }

      const html = await response.text();
      const parsed = this.parseHtmlToText(html, maxChars);
      if (!parsed.text) {
        return this.buildError('EMPTY_CONTENT', '静态页面未提取到正文', url, 'static');
      }

      return {
        ok: true,
        sourceUrl: url,
        finalUrl: response.url || url,
        mode: 'static',
        title: parsed.title,
        text: parsed.text,
        excerpt: parsed.text.slice(0, 240),
      };
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return this.buildError('TIMEOUT', '静态提取超时', url, 'static');
      }
      return this.buildError('NETWORK', `静态提取失败: ${error?.message || 'unknown error'}`, url, 'static');
    } finally {
      clearTimeout(timer);
    }
  }

  private async tryDynamic(
    url: string,
    dynamicExtractor: DynamicExtractor,
    timeoutMs: number,
    maxChars: number
  ): Promise<ExtractWebContentResult> {
    try {
      const result = await dynamicExtractor({ url, timeoutMs, maxChars });
      const text = this.normalizeText(result.text, maxChars);
      if (!text) {
        return this.buildError('EMPTY_CONTENT', '动态渲染后未提取到正文', url, 'dynamic');
      }

      return {
        ok: true,
        sourceUrl: url,
        finalUrl: result.finalUrl || url,
        mode: 'dynamic',
        title: result.title || '',
        text,
        excerpt: text.slice(0, 240),
      };
    } catch (error: any) {
      const message = error?.message || 'dynamic extract failed';
      if (message.toLowerCase().includes('timeout')) {
        return this.buildError('TIMEOUT', `动态提取超时: ${message}`, url, 'dynamic');
      }
      return this.buildError('UNKNOWN', `动态提取失败: ${message}`, url, 'dynamic');
    }
  }

  private parseHtmlToText(html: string, maxChars: number): { title: string; text: string } {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = this.decodeEntities((titleMatch?.[1] || '').trim());

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch?.[1] || html;
    let cleaned = bodyHtml;

    cleaned = cleaned
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<canvas[\s\S]*?<\/canvas>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(header|footer|nav|aside|form|button|input|select|textarea)[^>]*>[\s\S]*?<\/\1>/gi, ' ');

    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|article|section)>/gi, '\n');
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');

    return {
      title,
      text: this.normalizeText(this.decodeEntities(cleaned), maxChars),
    };
  }

  private normalizeText(text: string, maxChars: number): string {
    const normalized = text.replace(/\u00A0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return normalized.slice(0, maxChars);
  }

  private decodeEntities(input: string): string {
    const entities: Record<string, string> = {
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
    };
    return input.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => entities[entity] ?? entity);
  }

  private normalizeUrl(rawUrl: string): string | null {
    const input = rawUrl
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/：/g, ':')
      .replace(/／/g, '/')
      .replace(/．/g, '.')
      .trim()
      .replace(/^["'“”‘’([{【《]+/g, '')
      .replace(/["'“”‘’)\]}】》，。；：！？、]+$/g, '');
    if (!input) {
      return null;
    }
    const maybeUrl = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    try {
      const parsed = new URL(maybeUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  private isBlockedUrl(url: string): boolean {
    try {
      const { hostname } = new URL(url);
      const lower = hostname.toLowerCase();
      if (lower === 'localhost' || lower === '127.0.0.1' || lower === '::1') {
        return true;
      }
      if (/^10\./.test(lower) || /^192\.168\./.test(lower) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) {
        return true;
      }
      return false;
    } catch {
      return true;
    }
  }

  private isGoodEnough(text: string, minChars: number): boolean {
    if (text.length < minChars) {
      return false;
    }
    const low = text.toLowerCase();
    if (low.includes('enable javascript') || low.includes('please turn javascript on')) {
      return false;
    }
    return true;
  }

  private buildError(
    errorCode: WebExtractErrorCode,
    message: string,
    sourceUrl = '',
    mode: WebExtractMode = 'static'
  ): ExtractWebContentResult {
    return {
      ok: false,
      sourceUrl,
      mode,
      title: '',
      text: '',
      excerpt: '',
      errorCode,
      message,
    };
  }
}

export const webContentService = new WebContentService();
