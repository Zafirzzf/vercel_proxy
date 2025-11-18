// api/chat.ts
export const config = {
  runtime: "edge"
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  prompt?: string;  // 兼容旧版，如果有 messages 则忽略
  messages?: Message[];
  model?: string;
  stream?: boolean;  // 控制是否流式输出
}

export default async function handler(req: Request) {
  console.log('=== Edge Function Started ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed');
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json() as ChatRequest;
    console.log('📥 Received body:', JSON.stringify(body));
    
    // 构建 messages 数组
    let messages: Message[] = [];
    
    if (body.messages && Array.isArray(body.messages)) {
      // 使用传入的历史对话
      messages = body.messages;
      console.log('📜 Using message history, count:', messages.length);
    } else if (body.prompt) {
      // 兼容旧版单条 prompt
      messages = [{ role: "user", content: body.prompt }];
      console.log('💬 Using single prompt');
    } else {
      console.log('❌ Invalid request: no messages or prompt');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request', 
          details: 'messages array or prompt is required'
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 验证 messages 格式
    const isValidMessages = messages.every(msg => 
      msg.role && msg.content && 
      ['user', 'assistant', 'system'].includes(msg.role)
    );
    
    if (!isValidMessages) {
      console.log('❌ Invalid messages format');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid messages format',
          details: 'Each message must have role (user/assistant/system) and content'
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const key = process.env.API_KEY;
    if (!key) {
      console.log('❌ API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('🔑 API Key found, length:', key.length);

    // 构建智谱 API 请求
    const model = body.model || "glm-4";
    const stream = body.stream ?? true;  // 默认使用流式
    
    const requestBody = {
      model: model,
      messages: messages,
      stream: stream
    };
    console.log('📤 Sending to API:', JSON.stringify({ ...requestBody, stream }));

    const apiRes = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📨 API Response status:', apiRes.status);

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.log('❌ API returned error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Upstream API error',
          status: apiRes.status,
          details: errorText
        }),
        { status: apiRes.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // 如果是流式响应，直接转发流
    if (stream) {
      console.log('🌊 Streaming response');
      return new Response(apiRes.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 非流式响应
    const responseText = await apiRes.text();
    console.log('📨 API Response body:', responseText);
    console.log('✅ Success');
    
    return new Response(responseText, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}