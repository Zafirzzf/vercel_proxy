// api/chat.ts
export const config = {
  runtime: "edge"
};

interface ChatRequest {
  prompt: string;
  model?: string;
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
    
    // 验证参数
    if (!body.prompt || typeof body.prompt !== 'string') {
      console.log('❌ Invalid prompt:', body.prompt);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request', 
          details: 'prompt is required and must be a string',
          received: body
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
    const requestBody = {
      model: body.model || "glm-4",
      messages: [
        { role: "user", content: body.prompt }
      ]
    };
    console.log('📤 Sending to API:', JSON.stringify(requestBody));

    const apiRes = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📨 API Response status:', apiRes.status);
    
    const responseText = await apiRes.text();
    console.log('📨 API Response body:', responseText);

    if (!apiRes.ok) {
      console.log('❌ API returned error');
      return new Response(
        JSON.stringify({ 
          error: 'Upstream API error',
          status: apiRes.status,
          details: responseText
        }),
        { status: apiRes.status, headers: { "Content-Type": "application/json" } }
      );
    }

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