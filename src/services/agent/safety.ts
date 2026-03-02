const INJECTION_PATTERNS = [
  /ignore\s+all\s+previous\s+instructions/i,
  /reveal\s+system\s+prompt/i,
  /developer\s+message/i,
  /bypass\s+safety/i,
];

const SECRET_PATTERNS = [
  /(sk-[a-zA-Z0-9]{16,})/g,
  /(api[_-]?key\s*[:=]\s*[a-zA-Z0-9\-_]+)/gi,
];

export const safety = {
  isPromptInjection(text: string): boolean {
    return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
  },
  sanitizeOutput(text: string): string {
    let sanitized = text;
    for (const pattern of SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
  },
};
