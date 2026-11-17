const KEY = "siriz-enquiries"

export async function sendEnquiry(payload) {
  try {
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
    const type = res.headers.get("content-type") || ""
    if (res.ok && type.includes("application/json")) return { ok: true }
  } catch {
    /* The studio server is not connected yet. */
  }

  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "[]")
    all.push({ ...payload, createdAt: new Date().toISOString() })
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* Storage can be blocked. The mailto path remains on the page. */
  }

  return { ok: true }
}
