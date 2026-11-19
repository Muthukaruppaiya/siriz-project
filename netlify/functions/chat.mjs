/**
 * Optional AI chat endpoint for Netlify.
 * Set OPENAI_API_KEY in the Netlify environment. Never expose it to the browser.
 * Point VITE_CHAT_API_URL to /.netlify/functions/chat
 */
const SYSTEM = `You are Pip, the Interior Design Assistant for Siriz Interiors in Medavakkam, Chennai.
Be friendly, professional, and short. Ask only one question at a time.
Stay on interior design. Never invent prices, discounts, warranties, or delivery dates.
Verified studio facts you may share: phone +91 84384 23938, email info@sirizinteriors.com,
WhatsApp available, studio at 5th main road, Sivagami street, Pearl Flora Building, Medavakkam, Chennai, Tamil Nadu 600100,
forty-five days guaranteed delivery, ten-year warranty on wooden work.
If a fact is unknown, ask the customer to call or WhatsApp the studio.`

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: cors(),
    }
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method-not-allowed" })
  }

  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return json(501, { error: "missing-openai-key", message: "Set OPENAI_API_KEY on the server." })
  }

  try {
    const body = JSON.parse(event.body || "{}")
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : []
    const lang = body.lang === "ta" ? "Tamil" : "English"
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: `${SYSTEM}\nReply in ${lang}.` },
          ...messages.map((item) => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: String(item.content || "").slice(0, 2000),
          })),
        ],
      }),
    })
    if (!response.ok) {
      return json(502, { error: "upstream" })
    }
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) return json(502, { error: "empty" })
    return json(200, { text })
  } catch {
    return json(500, { error: "server" })
  }
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...cors(),
    },
    body: JSON.stringify(body),
  }
}
