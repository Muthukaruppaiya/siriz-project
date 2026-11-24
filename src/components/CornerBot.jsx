import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { studio } from "../data/site"
import { suggestedQuestions } from "../data/chatKnowledge"
import { fetchAiReply } from "../lib/chatApi"
import { createChatSession } from "../lib/chatEngine"
import Pip from "./Pip"

const copy = {
  ta: {
    name: "பிப்",
    role: "உள்துறை உதவியாளர்",
    hello: "எப்படி உதவலாம்?",
    more: "மேலும்",
    greeting: "வணக்கம், நான் பிப் — உங்கள் உள்துறை வடிவமைப்பு உதவியாளர். சேவைகள், பாணிகள், அல்லது ஆலோசனை பற்றி கேளுங்கள்.",
    nudge: "உதவி வேண்டுமா?",
    dialog: "உள்துறை உதவியாளருடன் அரட்டை",
    listen: "கேட்கிறேன்",
    talk: "பேசுகிறேன்",
    typing: "தட்டச்சு செய்கிறேன்",
    idle: "உள்துறை உதவி",
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
    clear: "அழி",
    clearLabel: "அரட்டையை அழி",
    whatsapp: "வாட்ஸ்அப்",
    whatsappLabel: "வாட்ஸ்அப்பில் தொடர்பு",
    error: "இப்போது பதிலளிக்க முடியவில்லை. மீண்டும் முயலவும் அல்லது வாட்ஸ்அப்பைப் பயன்படுத்தவும்.",
    unsupported: "குரல் உள்ளீடு Chrome அல்லது Edge-ல் கிடைக்கும். நீங்கள் தட்டச்சு செய்யலாம்.",
    blocked: "மைக்ரோஃபோன் தடுக்கப்பட்டுள்ளது. அனுமதி கொடுங்கள், அல்லது தட்டச்சு செய்யுங்கள்.",
    voice: "ta-IN",
    voicePrefix: "ta",
  },
  en: {
    name: "Pip",
    role: "Interior Design Assistant",
    hello: "How can I help you?",
    more: "More",
    greeting: "Hello, I'm Pip — your Interior Design Assistant. Ask about services, styles, materials, budget planning, or book a consultation.",
    nudge: "May I help?",
    dialog: "Chat with the Interior Design Assistant",
    listen: "Listening",
    talk: "Speaking",
    typing: "Typing",
    idle: "Interior help",
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
    clear: "Clear",
    clearLabel: "Clear chat",
    whatsapp: "WhatsApp",
    whatsappLabel: "Contact on WhatsApp",
    error: "I could not reply just now. Please try again or use WhatsApp.",
    unsupported: "Voice input works in Chrome or Edge. You can type instead.",
    blocked: "The microphone is blocked. Allow the mic for this site, or type your message.",
    voice: "en-IN",
    voicePrefix: "en",
  },
}

function storedLang() {
  try {
    return localStorage.getItem("siriz-bot-lang") === "ta" ? "ta" : "en"
  } catch {
    return "en"
  }
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
      <path d="M5 12h12M13 6l6 6-6 6" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg className="glass-chevron" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
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

function IconClear() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  )
}

function useBotMotion(rootRef) {
  const spot = useRef({ x: 0, y: 0 })
  const drag = useRef(null)
  const dragged = useRef(false)
  const [floating, setFloating] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    root.style.transform = `translate3d(${spot.current.x}px, ${spot.current.y}px, 0)`
  }, [rootRef])

  const clamp = (x, y) => {
    const root = rootRef.current
    const width = root?.offsetWidth || 150
    const height = root?.offsetHeight || 190
    return {
      x: Math.min(10, Math.max(-(window.innerWidth - width - 8), x)),
      y: Math.min(10, Math.max(-(window.innerHeight - height - 8), y)),
    }
  }

  const paint = () => {
    const root = rootRef.current
    if (!root) return
    root.style.transform = `translate3d(${spot.current.x}px, ${spot.current.y}px, 0)`
  }

  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return
    drag.current = {
      id: event.pointerId,
      sx: event.clientX,
      sy: event.clientY,
      ox: spot.current.x,
      oy: spot.current.y,
    }
    dragged.current = false
    setFloating(true)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* A pointer that is already gone should not stop the drag. */
    }
  }

  const onPointerMove = (event) => {
    const active = drag.current
    if (!active || event.pointerId !== active.id) return
    const dx = event.clientX - active.sx
    const dy = event.clientY - active.sy
    if (Math.hypot(dx, dy) > 8) dragged.current = true
    spot.current = clamp(active.ox + dx, active.oy + dy)
    paint()
  }

  const onPointerUp = (event) => {
    if (!drag.current || event.pointerId !== drag.current.id) return
    drag.current = null
    setFloating(false)
  }

  const onClick = (event) => {
    if (!dragged.current) return false
    event.preventDefault()
    event.stopPropagation()
    dragged.current = false
    return true
  }

  return { floating, onPointerDown, onPointerMove, onPointerUp, onClick }
}

export default function CornerBot() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [heard, setHeard] = useState("")
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [typing, setTyping] = useState(false)
  const [muted, setMuted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [lang, setLang] = useState(storedLang)
  const [prompt, setPrompt] = useState(false)
  const [more, setMore] = useState(false)
  const [waveTick, setWaveTick] = useState(0)
  const [messages, setMessages] = useState(() => {
    const start = storedLang()
    return [{ from: "bot", text: copy[start].greeting, lang: start }]
  })
  const motionRef = useRef(null)
  const motion = useBotMotion(motionRef)
  const listRef = useRef(null)
  const fieldRef = useRef(null)
  const recognitionRef = useRef(null)
  const mutedRef = useRef(false)
  const langRef = useRef(lang)
  const sessionRef = useRef(createChatSession())
  const greeted = useRef(false)
  const pack = copy[lang]
  const suggestions = suggestedQuestions[lang]

  function speak(text, voiceLang = langRef.current) {
    if (mutedRef.current || !window.speechSynthesis || !text) return
    const voicePack = copy[voiceLang] || copy.en
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
  }, [open, messages, heard, typing])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    if (!open || greeted.current) return
    greeted.current = true
    speak(copy[langRef.current].greeting)
  }, [open])

  useEffect(() => {
    if (open) return
    recognitionRef.current?.abort()
    setListening(false)
    setHeard("")
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [open])

  useEffect(() => () => {
    recognitionRef.current?.abort()
    window.speechSynthesis?.cancel()
  }, [])

  useEffect(() => {
    if (open) {
      setPrompt(false)
      return undefined
    }
    let hide = 0
    const id = window.setInterval(() => {
      setWaveTick((value) => value + 1)
      setPrompt(true)
      window.clearTimeout(hide)
      hide = window.setTimeout(() => setPrompt(false), 2400)
    }, 5000)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(hide)
    }
  }, [open])

  async function respond(value, historyItems) {
    const active = langRef.current
    setTyping(true)
    setBusy(true)
    try {
      const collecting = sessionRef.current.snapshot().collecting
      const history = historyItems.slice(-12).map((item) => ({
        role: item.from === "you" ? "user" : "assistant",
        content: item.text,
      }))
      const remote = collecting ? null : await fetchAiReply({ messages: history, lang: active })
      const reply = remote || await sessionRef.current.reply(value, active)
      setMessages((items) => [...items, { from: "bot", ...reply, lang: active }])
      speak(reply.text, active)
    } catch {
      setMessages((items) => [
        ...items,
        {
          from: "bot",
          text: copy[active].error,
          lang: active,
          href: studio.whatsapp,
          label: copy[active].whatsapp,
        },
      ])
    } finally {
      setTyping(false)
      setBusy(false)
    }
  }

  function send(text) {
    const value = text.trim()
    if (!value || busy) return
    const active = langRef.current
    const history = [...messages, { from: "you", text: value, lang: active }]
    setBusy(true)
    setMessages(history)
    setDraft("")
    setHeard("")
    respond(value, history)
  }

  function clearChat() {
    sessionRef.current = createChatSession()
    recognitionRef.current?.abort()
    setListening(false)
    setHeard("")
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    setTyping(false)
    setBusy(false)
    const active = langRef.current
    setMessages([{ from: "bot", text: copy[active].greeting, lang: active }])
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

  const status = listening ? pack.listen : typing ? pack.typing : speaking ? pack.talk : pack.idle
  const showSuggestions = messages.length <= 2 && !typing

  return (
    <div ref={motionRef} className={`corner-bot ${open ? "is-open" : ""} ${listening ? "is-listen" : ""} ${speaking || typing ? "is-talking" : ""}`}>
      <div className={`bot-float${motion.floating ? " is-on" : ""}`}>
      {open && createPortal(
        <section
          className="bot-panel is-full"
          role="dialog"
          lang={lang === "en" ? "en" : "ta"}
          aria-label={pack.dialog}
          onWheel={hold}
          onTouchMove={hold}
        >
          <header className="bot-panel-bar">
            <p className="bot-hello">{pack.hello}</p>
            <div className="bot-tools">
              <button type="button" className="bot-icon" aria-pressed={muted} aria-label={muted ? pack.muteOn : pack.muteOff} onClick={toggleMute}>
                <IconSound off={muted} />
              </button>
              <button type="button" className="bot-icon" aria-label={pack.clearLabel} onClick={clearChat}>
                <IconClear />
              </button>
              <button type="button" className="bot-icon" onClick={() => setOpen(false)} aria-label={pack.close}>
                <IconClose />
              </button>
            </div>
          </header>
          <p className="bot-status"><i />{status}</p>
          {!showSuggestions && (
            <div className="bot-log" ref={listRef}>
              {messages.map((message, index) => (
                <div className={`bot-row bot-row-${message.from}`} key={`${message.from}-${index}`}>
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
              {typing && (
                <div className="bot-row bot-row-bot">
                  <div className="bot-line bot-line-bot bot-typing" aria-label={pack.typing}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>
          )}
          {showSuggestions && <div ref={listRef} />}
          {showSuggestions && (
            <div className="bot-chips">
              {suggestions.map((chip) => (
                <button key={chip} className="glass-row" type="button" disabled={busy} onClick={() => send(chip)}>
                  <span className="glass-ico" aria-hidden="true"><IconPlus /></span>
                  <span>{chip}</span>
                  <IconChevron />
                </button>
              ))}
            </div>
          )}
          {more && (
            <div className="bot-more">
              <button className="glass-row" type="button" aria-pressed={listening} onClick={toggleMic}>
                <span className="glass-ico" aria-hidden="true"><IconMic /></span>
                <span>{listening ? pack.micOn : pack.micOff}</span>
                <IconChevron />
              </button>
              <a className="glass-row" href={studio.whatsapp} target="_blank" rel="noreferrer">
                <span className="glass-ico" aria-hidden="true"><IconSend /></span>
                <span>{pack.whatsapp}</span>
                <IconChevron />
              </a>
              <a className="glass-row" href={studio.phoneHref}>
                <span className="glass-ico" aria-hidden="true"><IconMic /></span>
                <span>{studio.phone}</span>
                <IconChevron />
              </a>
              <button className="glass-row" type="button" onClick={switchLang} aria-label={pack.switchLabel}>
                <span className="glass-ico" aria-hidden="true">{pack.switchTo}</span>
                <span>{pack.switchLabel}</span>
                <IconChevron />
              </button>
            </div>
          )}
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
              className={`bot-plus ${more ? "is-on" : ""}`}
              type="button"
              aria-expanded={more}
              aria-label={more ? pack.close : pack.more}
              onClick={() => setMore((value) => !value)}
            >
              <IconPlus />
            </button>
            <textarea
              ref={fieldRef}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  send(draft)
                }
              }}
              placeholder={pack.placeholder}
              aria-label={pack.message}
            />
            <button className="bot-send" type="submit" aria-label={pack.send} disabled={busy}>
              <IconSend />
            </button>
          </form>
        </section>,
        document.body
      )}

      {prompt && !open && (
        <p className="bot-nudge" aria-hidden="true">{pack.nudge}</p>
      )}
      <button
        className="bot-stage"
        type="button"
        aria-expanded={open}
        aria-label={open ? pack.close : pack.open}
        onPointerDown={motion.onPointerDown}
        onPointerMove={motion.onPointerMove}
        onPointerUp={motion.onPointerUp}
        onPointerCancel={motion.onPointerUp}
        onClick={(event) => {
          if (motion.onClick(event)) return
          setOpen((value) => !value)
        }}
      >
        <span className="bot-ring" />
        <Pip speaking={speaking || typing} listening={listening} waveTick={waveTick} />
      </button>
      </div>
    </div>
  )
}
