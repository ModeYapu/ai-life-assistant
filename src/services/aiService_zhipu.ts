  /**
   * 调用智谱AI (GLM-5)
   */
  private async callZhipu(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
    const apiKey = this.apiKeys['zhipu'];
    if (!apiKey) {
      throw new Error('Zhipu AI API key not configured');
    }

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Zhipu AI API error');
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      tokens: data.usage?.total_tokens,
      latency: Date.now() - startTime,
    };
  }

  /**
   * 调用本地模型
   */
  private async callLocalModel(request: AIRequest, startTime: number): Promise<AIMessageResponse> {
    // 本地模型API端点（需要自行部署）
    const endpoint = this.apiKeys['local_endpoint'] || 'http://localhost:8000/v1/chat/completions';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4096,
        }),
      });

      if (!response.ok) {
        throw new Error('Local model API error');
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        tokens: data.usage?.total_tokens,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error('Failed to connect to local model. Please ensure the model server is running.');
    }
  }
