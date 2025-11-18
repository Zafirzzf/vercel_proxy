export const config = {
  runtime: "nodejs18.x"
};

export default async function handler(req, res) {
  try {
    const body = await req.json();

    const apiRes = await fetch("https://your-model.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        prompt: body.prompt
      })
    });

    const data = await apiRes.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}