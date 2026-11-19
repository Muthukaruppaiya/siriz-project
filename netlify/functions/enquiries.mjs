/**
 * Optional enquiry intake for Netlify.
 * Point VITE_ENQUIRY_API_URL to /.netlify/functions/enquiries
 * Without a database connection this still validates and acknowledges the lead.
 * Connect a CRM/email webhook with ENQUIRY_WEBHOOK_URL when ready.
 */
export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors() }
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "method-not-allowed" })
  }

  try {
    const payload = JSON.parse(event.body || "{}")
    const phone = String(payload.phone || "").replace(/\D/g, "")
    const email = String(payload.email || "")
    const ok = Boolean(
      String(payload.name || "").trim()
        && phone.length >= 10
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        && String(payload.location || "").trim()
        && String(payload.propertyType || "").trim()
        && String(payload.services || "").trim()
    )
    if (!ok) return json(400, { error: "missing-fields" })

    const record = {
      ...payload,
      phone,
      createdAt: new Date().toISOString(),
    }

    const webhook = process.env.ENQUIRY_WEBHOOK_URL
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      })
    }

    return json(200, { ok: true })
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
