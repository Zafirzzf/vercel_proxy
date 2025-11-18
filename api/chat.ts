// api/chat.ts
export const config = {
  runtime: "edge"
};

export default async function handler(req: Request) {
  const body = await req.json();
  const key = process.env.MODEL_API_KEY;

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