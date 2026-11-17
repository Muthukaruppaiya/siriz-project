import { useState } from "react"
import { studio } from "../data/site"
import { sendEnquiry } from "../lib/enquiries"
import { ParallaxImage } from "../components/Parallax"
import { useTitle } from "../useTitle"

const initial = {
  name: "",
  email: "",
  phone: "",
  projectType: "Full home",
  message: "",
  company: "",
}

const types = ["Full home", "Modular kitchen", "Living room", "Bedroom", "Wardrobe"]

export default function Contact() {
  useTitle("Contact")
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState("idle")

  function update(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    const next = {}
    if (form.name.trim().length < 2) next.name = "Please leave your name."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Please leave a valid email."
    if (form.message.trim().length < 10) next.message = "Tell us a little about the room."
    setErrors(next)
    if (Object.keys(next).length) return
    if (form.company) {
      setStatus("sent")
      return
    }
    setStatus("sending")
    await sendEnquiry({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      projectType: form.projectType,
      message: form.message.trim(),
    })
    setStatus("sent")
  }

  return (
    <>
      <section className="enquiry">
        <div className="enquiry-copy">
          <p className="kicker">Contact</p>
          <h1>Meet a designer.</h1>
          <p className="lede">
            Siriz offers a free consultation. Tell us about the home, and the studio will talk through
            ideas, time, and budget.
          </p>
          <p>
            <a href={studio.phoneHref}>{studio.phone}</a>
          </p>
          <p>
            <a href={`mailto:${studio.email}`}>{studio.email}</a>
          </p>
          <p className="form-note">{studio.location}</p>
        </div>
        {status === "sent" ? (
          <div className="thanks">
            <p className="kicker">Received</p>
            <h2>Thank you{form.name ? `, ${form.name.split(" ")[0]}` : ""}.</h2>
            <p>
              Your note is saved in this browser. You can also call{" "}
              <a href={studio.phoneHref}>{studio.phone}</a> or write to{" "}
              <a href={`mailto:${studio.email}`}>{studio.email}</a>.
            </p>
          </div>
        ) : (
          <form className="enquiry-form" onSubmit={submit} noValidate>
            <label className="honeypot">
              Company
              <input name="company" value={form.company} onChange={update} tabIndex={-1} autoComplete="off" />
            </label>
            <Field label="Name" name="name" value={form.name} onChange={update} error={errors.name} />
            <Field label="Email" name="email" type="email" value={form.email} onChange={update} error={errors.email} />
            <Field label="Phone" name="phone" value={form.phone} onChange={update} optional />
            <div className="field">
              <label htmlFor="projectType">Project</label>
              <select id="projectType" name="projectType" value={form.projectType} onChange={update}>
                {types.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <Field
              label="The room"
              name="message"
              value={form.message}
              onChange={update}
              error={errors.message}
              multiline
            />
            <button className="btn" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending" : "Send the note"}
            </button>
            <p className="form-note">{studio.formNote}</p>
          </form>
        )}
      </section>
      <section className="contact-figure" data-header="light">
        <ParallaxImage
          className="parallax--fill"
          src={studio.about}
          alt={studio.aboutAlt}
          speed={0.2}
        />
      </section>
    </>
  )
}

function Field({ label, name, value, onChange, error, type = "text", optional = false, multiline = false }) {
  const id = `field-${name}`
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {optional ? " — optional" : ""}
      </label>
      {multiline ? (
        <textarea id={id} name={name} value={value} onChange={onChange} rows={5} aria-invalid={Boolean(error)} />
      ) : (
        <input id={id} name={name} type={type} value={value} onChange={onChange} aria-invalid={Boolean(error)} />
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
