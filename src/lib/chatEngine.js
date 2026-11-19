import { knowledge, leadFields, verified } from "../data/chatKnowledge"
import { sendEnquiry } from "./enquiries"

const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const phoneOk = (value) => value.replace(/\D/g, "").length >= 10

function normalize(raw) {
  return String(raw || "").trim()
}

function lower(raw) {
  return normalize(raw).toLowerCase()
}

function wantsLead(text) {
  return /book|consult|enquiry|enquir|quote|start project|design my|want to design|ஆலோசனை|பதிவு|விசாரணை|தொடங்க/.test(text)
}

function yes(text) {
  return /^(yes|yeah|yep|sure|ok|okay|please|ஆம்|சரி|வேண்டும்)/i.test(text.trim())
}

function no(text) {
  return /^(no|nope|not now|later|இல்லை|வேண்டாம்)/i.test(text.trim())
}

function contactLinks(lang) {
  if (lang === "ta") {
    return {
      href: verified.whatsapp,
      label: "வாட்ஸ்அப் திறக்க",
      phoneHref: verified.phoneHref,
      phoneLabel: "இப்போது அழைக்க",
    }
  }
  return {
    href: verified.whatsapp,
    label: "Open WhatsApp",
    phoneHref: verified.phoneHref,
    phoneLabel: "Call now",
  }
}

function knowledgeReply(text, lang) {
  const item = knowledge.find((entry) => entry.match.test(text))
  if (!item) return null
  const links = contactLinks(lang)
  const reply = { text: item[lang] || item.en }
  if (item.id === "contact") {
    reply.href = links.href
    reply.label = links.label
  }
  if (item.id === "process" || item.id === "budget") {
    reply.href = links.phoneHref
    reply.label = links.phoneLabel
  }
  return reply
}

function greetFallback(lang) {
  return lang === "ta"
    ? "உள்துறை சேவைகள், பாணிகள், பொருட்கள், அல்லது ஆலோசனை பற்றி கேளுங்கள். ஒரு கேள்விக்கு ஒரு பதில் தருவேன்."
    : "Ask about services, styles, materials, or a consultation. I will answer one step at a time."
}

function askField(field, lang) {
  return lang === "ta" ? field.ta : field.en
}

/**
 * Local trained consultant. Keeps lead state and asks one question at a time.
 */
export function createChatSession() {
  let lead = {}
  let step = -1
  let awaitingConfirm = false

  return {
    reset() {
      lead = {}
      step = -1
      awaitingConfirm = false
    },
    snapshot() {
      return { lead: { ...lead }, collecting: step >= 0, awaitingConfirm, step }
    },
    async reply(raw, lang = "en") {
      const text = normalize(raw)
      const soft = lower(text)
      if (!text) {
        return { text: lang === "ta" ? "ஒரு செய்தி எழுதுங்கள்." : "Please write a short message." }
      }

      if (awaitingConfirm) {
        awaitingConfirm = false
        if (no(soft)) {
          return {
            text: lang === "ta"
              ? "சரி. தேவைப்பட்டால் பின்னர் தொடரலாம்."
              : "No problem. We can continue whenever you are ready.",
          }
        }
        step = 0
        lead = {}
        return {
          text: lang === "ta"
            ? `சிறப்பு. ஒரு சிறிய விசாரணையைத் தொடங்குவோம். ${askField(leadFields[0], lang)}`
            : `Great. I will take a short enquiry for the studio. ${askField(leadFields[0], lang)}`,
        }
      }

      if (step >= 0) {
        const field = leadFields[step]
        if (field.key === "email" && !emailOk(text)) {
          return { text: lang === "ta" ? "சரியான மின்னஞ்சலை அனுப்புங்கள்." : "Please share a valid email address." }
        }
        if (field.key === "phone" && !phoneOk(text)) {
          return { text: lang === "ta" ? "சரியான மொபைல் எண்ணை அனுப்புங்கள்." : "Please share a valid mobile number." }
        }
        lead[field.key] = text
        step += 1
        if (step < leadFields.length) {
          return { text: askField(leadFields[step], lang) }
        }

        const payload = {
          ...lead,
          source: "interior-design-assistant",
          lang,
        }
        step = -1
        const saved = await sendEnquiry(payload)
        lead = {}
        const links = contactLinks(lang)
        if (!saved?.ok) {
          return {
            text: lang === "ta"
              ? "விசாரணையை சேமிக்க முடியவில்லை. வாட்ஸ்அப் அல்லது அழைப்பு மூலம் தொடரவும்."
              : "I could not save the enquiry just now. Please continue on WhatsApp or by phone.",
            href: links.href,
            label: links.label,
          }
        }
        return {
          text: lang === "ta"
            ? "நன்றி. உங்கள் விசாரணை சேமிக்கப்பட்டது. ஸ்டுடியோ விரைவில் தொடர்பு கொள்ளும்."
            : "Thank you. Your enquiry is saved, and the studio will get in touch soon.",
          href: links.href,
          label: links.label,
        }
      }

      if (wantsLead(soft) || knowledge.find((entry) => entry.id === "book" && entry.match.test(soft))) {
        step = 0
        lead = {}
        return {
          text: lang === "ta"
            ? `சிறப்பு. ஒரு சிறிய விசாரணையைத் தொடங்குவோம். ${askField(leadFields[0], lang)}`
            : `Great. I will take a short enquiry for the studio. ${askField(leadFields[0], lang)}`,
        }
      }

      const known = knowledgeReply(soft, lang)
      if (known) {
        if (known.text.includes("book a consultation") || known.text.includes("ஆலோசனை பதிவு")) {
          awaitingConfirm = true
        }
        return known
      }

      if (/hi|hello|hey|வணக்கம்/.test(soft)) {
        return {
          text: lang === "ta"
            ? "வணக்கம். நான் உங்கள் உள்துறை உதவியாளர். சேவைகள், பட்ஜெட், அல்லது ஆலோசனை பற்றி கேளுங்கள்."
            : "Hello. I am your Interior Design Assistant. Ask about services, budget planning, or a consultation.",
        }
      }

      return { text: greetFallback(lang) }
    },
  }
}
