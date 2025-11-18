export const config = {
  runtime: "nodejs"
};

export default async function handler(req: any) {
  const body = await req.json();

  const key = process.env.MODEL_API_KEY;  // ✔ 类型 + 运行时 都安全

  const apiRes = await fetch("https://your-model.com/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({ prompt: body.prompt })
  });

  return new Response(await apiRes.text(), {
    headers: { "Content-Type": "application/json" }
  });
}
