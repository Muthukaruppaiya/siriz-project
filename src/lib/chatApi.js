/**
 * Optional remote AI reply.
 * Set VITE_CHAT_API_URL to a backend endpoint that accepts:
 * { messages: [{ role, content }], lang }
 * and returns { text } or { reply }.
 *
 * Keep API keys on the server only. Never put OPENAI_API_KEY in VITE_ vars.
 */
export async function fetchAiReply({ messages, lang }) {
  const url = import.meta.env.VITE_CHAT_API_URL
  if (!url) return null

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ messages, lang }),
      signal: controller.signal,
    })
    if (!response.ok) return null
    const data = await response.json()
    const text = data.text || data.reply || data.message
    return text ? { text: String(text) } : null
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
