import { agentMemory } from './memory';

type ToolResult = {
  ok: boolean;
  data?: string;
  error?: string;
};

type ToolHandler = (input: {
  conversationId: string;
  query: string;
}) => Promise<ToolResult>;

class ToolRegistry {
  private handlers = new Map<string, ToolHandler>();

  register(name: string, handler: ToolHandler): void {
    this.handlers.set(name, handler);
  }

  async run(name: string, input: { conversationId: string; query: string }): Promise<ToolResult> {
    const handler = this.handlers.get(name);
    if (!handler) {
      return { ok: false, error: `Tool not found: ${name}` };
    }
    return handler(input);
  }
}

export const toolRegistry = new ToolRegistry();

toolRegistry.register('memory.search', async ({ conversationId, query }) => {
  const items = await agentMemory.retrieve(conversationId, query, 5);
  const content = items.map((item, index) => `${index + 1}. ${item.content}`).join('\n');
  return { ok: true, data: content || 'No relevant memory found.' };
});
