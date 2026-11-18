import { useEffect, useRef, useState } from "react"
import { studio } from "../data/site"
import GuideModel from "./GuideModel"

const copy = {
  ta: {
    name: "மேகா",
    greeting: "வணக்கம், நான் மேகா. ஸ்டுடியோ, வருகை அல்லது அழைப்பு பற்றி கேளுங்கள்.",
    dialog: "மேகாவுடன் அரட்டை",
    listen: "கேட்கிறேன்",
    talk: "பேசுகிறேன்",
    idle: "ஸ்டுடியோ உதவி",
    muteOn: "குரலை இயக்கு",
    muteOff: "குரலை நிறுத்து",
    close: "அரட்டையை மூடு",
    open: "அரட்டையைத் திற",
    hear: "கேள்",
    hearLabel: "பதிலைக் கேள்",
    placeholder: "செய்தி எழுதுங்கள்",
    message: "செய்தி",
    send: "அனுப்பு",
    micOn: "குரலை நிறுத்து",
    micOff: "குரல் செய்தி",
    switchTo: "EN",
    switchLabel: "ஆங்கிலத்திற்கு மாறு",
    chips: ["அழைப்பு", "முகவரி", "வாட்ஸ்அப்"],
    unsupported: "குரல் உள்ளீடு Chrome அல்லது Edge-ல் கிடைக்கும். நீங்கள் தட்டச்சு செய்யலாம், பதிலை நான் பேசுவேன்.",
    blocked: "மைக்ரோஃபோன் தடுக்கப்பட்டுள்ளது. இந்த தளத்திற்கு மைக் அனுமதி கொடுங்கள், அல்லது தட்டச்சு செய்யுங்கள்.",
    voice: "ta-IN",
    voicePrefix: "ta",
    whatsapp: ["வாட்ஸ்அப்பில் ஸ்டுடியோவுக்கு செய்தி அனுப்புங்கள்.", "வாட்ஸ்அப் திறக்க"],
    phone: [`ஸ்டுடியோ எண் ${studio.phone}.`, "இப்போது அழைக்க"],
    email: [`${studio.email} என்ற முகவரிக்கு எழுதுங்கள்.`, "மின்னஞ்சல் அனுப்பு"],
    address: [`ஸ்டுடியோ முகவரி: ${studio.location}.`],
    price: ["ஒவ்வொரு வீடும் உரையாடலுக்குப் பிறகு விலை நிர்ணயம் செய்யப்படும். அழைப்பு எளிதான தொடக்கம்.", "ஸ்டுடியோவை அழைக்க"],
    time: ["டெலிவரி நாற்பத்தைந்து நாட்கள். மர வேலைக்கு பத்து ஆண்டு உத்தரவாதம்."],
    hi: ["வணக்கம். தொலைபேசி எண், முகவரி அல்லது வேலை எப்படி தொடங்கும் என்று சொல்ல முடியும்."],
    fallback: ["தொலைபேசி எண், மேடவாக்கம் ஸ்டுடியோ அல்லது வாட்ஸ்அப் செய்திக்கு உதவ முடியும்."],
  },
  en: {
    name: "Mega",
    greeting: "Hello, I'm Mega. Ask about the studio, a visit, or a call.",
    dialog: "Chat with Mega",
    listen: "Listening",
    talk: "Speaking",
    idle: "Studio help",
    muteOn: "Turn voice on",
    muteOff: "Mute voice",
    close: "Close chat",
    open: "Open chat",
    hear: "Hear",
    hearLabel: "Hear the reply",
    placeholder: "Write a message",
    message: "Message",
    send: "Send",
    micOn: "Stop voice",
    micOff: "Voice message",
    switchTo: "தமிழ்",
    switchLabel: "Switch chat to Tamil",
    chips: ["Call", "Address", "WhatsApp"],
    unsupported: "Voice input works in Chrome or Edge. You can type, and I will speak the reply.",
    blocked: "The microphone is blocked. Allow the mic for this site, or type your message.",
    voice: "en-IN",
    voicePrefix: "en",
    whatsapp: ["Message the studio on WhatsApp.", "Open WhatsApp"],
    phone: [`The studio number is ${studio.phone}.`, "Call now"],
    email: [`Write to ${studio.email}.`, "Send email"],
    address: [`Studio address: ${studio.location}.`],
    price: ["Each home is priced after a conversation. A call is the simplest start.", "Call the studio"],
    time: ["Delivery is forty-five days. Woodwork carries a ten-year warranty."],
    hi: ["Hello. I can share the phone number, the address, or how a project starts."],
    fallback: ["I can help with the phone number, the Medavakkam studio, or a WhatsApp message."],
  },
}

function storedLang() {
  try {
    return localStorage.getItem("siriz-bot-lang") === "en" ? "en" : "ta"
  } catch {
    return "ta"
  }
}

function answer(raw, lang) {
  const pack = copy[lang]
  const text = raw.toLowerCase()
  const reply = (key, extra = {}) => ({ text: pack[key][0], label: pack[key][1], ...extra })
  if (/whatsapp|whats app|வாட்ஸ்/.test(text)) return reply("whatsapp", { href: studio.whatsapp })
  if (/phone|call|number|contact|அழை|தொலை/.test(text)) return reply("phone", { href: studio.phoneHref })
  if (/mail|email|மின்னஞ்சல்/.test(text)) return reply("email", { href: `mailto:${studio.email}` })
  if (/where|address|visit|chennai|location|studio|முகவரி|சென்னை|ஸ்டுடியோ|வருகை/.test(text)) return reply("address")
  if (/price|cost|quote|budget|charge|விலை/.test(text)) return reply("price", { href: studio.phoneHref })
  if (/time|day|long|deliver|warranty|நாள்|உத்தரவாதம்|டெலிவரி/.test(text)) return reply("time")
  if (/hi|hello|hey|வணக்கம்|வணக்க/.test(text)) return reply("hi")
  return reply("fallback")
}

function speechRecognition() {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition
  return Speech ? new Speech() : null
}

function IconMic() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function IconSound({ off = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10h3l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6" />
      {off && <path d="M5 5l14 14" />}
    </svg>
  )
}

export default function CornerBot() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [heard, setHeard] = useState("")
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [muted, setMuted] = useState(false)
  const [lang, setLang] = useState(storedLang)
  const [messages, setMessages] = useState(() => {
    const start = storedLang()
    return [{ from: "bot", text: copy[start].greeting, lang: start }]
  })
  const listRef = useRef(null)
  const fieldRef = useRef(null)
  const recognitionRef = useRef(null)
  const mutedRef = useRef(false)
  const langRef = useRef(lang)
  const greeted = useRef(false)
  const pack = copy[lang]

  function speak(text, voiceLang = langRef.current) {
    if (mutedRef.current || !window.speechSynthesis || !text) return
    const voicePack = copy[voiceLang] || copy.ta
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = voicePack.voice
    utter.rate = 0.92
    const voices = window.speechSynthesis.getVoices()
    const match = voices.find((voice) => voice.lang.toLowerCase() === voicePack.voice.toLowerCase())
      || voices.find((voice) => voice.lang.toLowerCase().startsWith(voicePack.voicePrefix))
    if (match) utter.voice = match
    utter.onstart = () => setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utter)
  }

  useEffect(() => {
    const list = listRef.current
    if (!open || !list) return
    list.scrollTop = list.scrollHeight
  }, [open, messages, heard])

  useEffect(() => {
    if (!open || greeted.current) return
    greeted.current = true
    speak(copy[langRef.current].greeting)
  }, [open])

  useEffect(() => () => {
    recognitionRef.current?.abort()
    window.speechSynthesis?.cancel()
  }, [])

  function send(text) {
    const value = text.trim()
    if (!value) return
    const active = langRef.current
    const reply = answer(value, active)
    setMessages((items) => [
      ...items,
      { from: "you", text: value, lang: active },
      { from: "bot", ...reply, lang: active },
    ])
    setDraft("")
    setHeard("")
    speak(reply.text, active)
  }

  function switchLang() {
    const next = langRef.current === "ta" ? "en" : "ta"
    recognitionRef.current?.abort()
    setListening(false)
    setHeard("")
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    langRef.current = next
    setLang(next)
    try {
      localStorage.setItem("siriz-bot-lang", next)
    } catch {
      /* the switch still works for this visit */
    }
    const onlyGreeting = messages.length === 1 && messages[0].from === "bot"
    if (onlyGreeting) {
      setMessages([{ from: "bot", text: copy[next].greeting, lang: next }])
      if (open) speak(copy[next].greeting, next)
    }
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const recognition = speechRecognition()
    if (!recognition) {
      setMessages((items) => [
        ...items,
        { from: "bot", text: copy[langRef.current].unsupported, lang: langRef.current },
      ])
      return
    }
    recognition.lang = copy[langRef.current].voice
    recognition.interimResults = true
    recognition.onresult = (event) => {
      let finalText = ""
      let interim = ""
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const chunk = event.results[index][0].transcript
        if (event.results[index].isFinal) finalText += chunk
        else interim += chunk
      }
      setHeard(interim)
      if (finalText.trim()) {
        setHeard("")
        send(finalText)
      }
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = (event) => {
      setListening(false)
      setHeard("")
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMessages((items) => [
          ...items,
          { from: "bot", text: copy[langRef.current].blocked, lang: langRef.current },
        ])
      }
    }
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  function toggleMute() {
    mutedRef.current = !mutedRef.current
    setMuted(mutedRef.current)
    if (mutedRef.current) {
      window.speechSynthesis?.cancel()
      setSpeaking(false)
    }
  }

  function hold(event) {
    event.stopPropagation()
  }

  const status = listening ? pack.listen : speaking ? pack.talk : pack.idle

  return (
    <div className={`corner-bot ${open ? "is-open" : ""} ${listening ? "is-listen" : ""} ${speaking ? "is-talking" : ""}`}>
      {open && (
        <section
          className="bot-panel"
          role="dialog"
          lang={lang === "en" ? "en" : "ta"}
          aria-label={pack.dialog}
          onWheel={hold}
          onTouchMove={hold}
        >
          <header className="bot-panel-bar">
            <div className="bot-id">
              <span className="bot-avatar" aria-hidden="true" />
              <div>
                <p>{pack.name}</p>
                <span className="bot-status">
                  <i />
                  {status}
                </span>
              </div>
            </div>
            <div className="bot-tools">
              <button type="button" className="bot-lang" onClick={switchLang} aria-label={pack.switchLabel}>
                {pack.switchTo}
              </button>
              <button type="button" className="bot-icon" aria-pressed={muted} aria-label={muted ? pack.muteOn : pack.muteOff} onClick={toggleMute}>
                <IconSound off={muted} />
              </button>
              <button type="button" className="bot-icon" onClick={() => setOpen(false)} aria-label={pack.close}>
                <IconClose />
              </button>
            </div>
          </header>
          <div className="bot-log" ref={listRef}>
            {messages.map((message, index) => (
              <div className={`bot-row bot-row-${message.from}`} key={`${message.from}-${index}`}>
                {message.from === "bot" && <span className="bot-avatar" aria-hidden="true" />}
                <div className={`bot-line bot-line-${message.from}`}>
                  <p lang={message.lang === "en" ? "en" : "ta"}>{message.text}</p>
                  {message.href && (
                    <a href={message.href} target={message.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                      {message.label}
                    </a>
                  )}
                  {message.from === "bot" && (
                    <button type="button" className="bot-hear" aria-label={pack.hearLabel} onClick={() => speak(message.text, message.lang)}>
                      <IconSound />
                      {pack.hear}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="bot-chips">
            {pack.chips.map((chip) => (
              <button key={chip} type="button" onClick={() => send(chip)}>
                {chip}
              </button>
            ))}
          </div>
          {listening && (
            <div className="bot-wave" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
          {heard && <p className="bot-heard">{heard}</p>}
          <form
            className="bot-form"
            onSubmit={(event) => {
              event.preventDefault()
              send(draft)
            }}
          >
            <button
              className={`bot-mic ${listening ? "is-on" : ""}`}
              type="button"
              aria-pressed={listening}
              aria-label={listening ? pack.micOn : pack.micOff}
              onClick={toggleMic}
            >
              <IconMic />
            </button>
            <input
              ref={fieldRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={pack.placeholder}
              aria-label={pack.message}
            />
            <button className="bot-send" type="submit" aria-label={pack.send}>
              <IconSend />
            </button>
          </form>
        </section>
      )}

      <button
        className="bot-stage"
        type="button"
        aria-expanded={open}
        aria-label={open ? pack.close : pack.open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="bot-ring" />
        <span className="bot-patrol">
          <span className="bot-jump">
            <span className="bot-shadow" />
            <span className="guide-view">
              <GuideModel speaking={speaking} listening={listening} />
            </span>
          </span>
        </span>
      </button>
    </div>
  )
}
