const KEY = "siriz-enquiries"

function requiredOk(payload) {
  const phone = String(payload.phone || "").replace(/\D/g, "")
  const email = String(payload.email || "")
  return Boolean(
    String(payload.name || "").trim()
      && phone.length >= 10
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      && String(payload.location || "").trim()
      && String(payload.propertyType || "").trim()
      && String(payload.services || "").trim()
  )
}

export function listEnquiries() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]")
  } catch {
    return []
  }
}

export async function sendEnquiry(payload) {
  if (!requiredOk(payload)) return { ok: false, error: "missing-fields" }

  const body = {
    ...payload,
    createdAt: new Date().toISOString(),
  }

  const endpoint = import.meta.env.VITE_ENQUIRY_API_URL || "/api/enquiries"
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })
    const type = res.headers.get("content-type") || ""
    if (res.ok && type.includes("application/json")) return { ok: true, stored: "api" }
  } catch {
    /* The studio server is not connected yet. */
  }

  try {
    const all = listEnquiries()
    all.push(body)
    localStorage.setItem(KEY, JSON.stringify(all))
    return { ok: true, stored: "local" }
  } catch {
    return { ok: false, error: "storage" }
  }
}
