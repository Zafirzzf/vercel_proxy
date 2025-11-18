export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  try {
    const body = await req.json();

    // 1. 推荐你从 body 中取输入内容（例如 messages、prompt）
    const { prompt } = body;

    // 2. 调用你自己的 HTTP 模型接口
    const apiRes = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 固定的 API Key 通过 Vercel 环境变量注入
        "Authorization": `Bearer ${process.env.MODEL_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 1000,         // 按你的接口格式来
        temperature: 0.8
      }),
    });

    const result = await apiRes.json();

    // 3. 包装/转发响应
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500
    });
  }
}