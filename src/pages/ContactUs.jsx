import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageCircle, Building2 } from 'lucide-react'
import './LegalPages.css'

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Opens default mail client with pre-filled content
    const mailto = `mailto:support@itfuturz.in?subject=${encodeURIComponent(form.subject || 'OnTrip Enquiry')}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`
    window.location.href = mailto
    setSent(true)
  }

  return (
    <div className="legal-root">
      <nav className="legal-nav">
        <div className="legal-nav-inner">
          <Link to="/" className="legal-back">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <span className="legal-brand">OnTrip</span>
        </div>
      </nav>

      <div className="legal-hero">
        <div className="legal-hero-icon"><MessageCircle size={28} /></div>
        <h1 className="legal-hero-title">Contact Us</h1>
        <p className="legal-hero-sub">We'd love to hear from you. Reach out anytime.</p>
      </div>

      <div className="legal-body">
        <div className="legal-container contact-layout">

          {/* Left — Info */}
          <div className="contact-info">
            <h2 className="contact-info-title">Get in touch</h2>
            <p className="contact-info-desc">Have a question, feedback, or need support? Fill out the form or reach us directly through the details below.</p>

            <div className="contact-cards">
              <div className="contact-card">
                <div className="contact-card-icon"><Mail size={18} /></div>
                <div>
                  <p className="contact-card-label">Email</p>
                  <a href="mailto:support@itfuturz.in" className="contact-card-value">info@itfuturz.com</a>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon"><Phone size={18} /></div>
                <div>
                  <p className="contact-card-label">Phone</p>
                  <a href="tel:+919999999999" className="contact-card-value">+91 99790 66311</a>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon"><Building2 size={18} /></div>
                <div>
                  <p className="contact-card-label">Company</p>
                  <a href="https://itfuturz.in" target="_blank" rel="noreferrer" className="contact-card-value">IT Futurz</a>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon"><MapPin size={18} /></div>
                <div>
                  <p className="contact-card-label">Location</p>
                  <p className="contact-card-value">Surat , India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="contact-form-wrap">
            {sent ? (
              <div className="contact-success">
                <div className="contact-success-icon"><Send size={28} /></div>
                <h3>Message Ready</h3>
                <p>Your email client should have opened with your message pre-filled. If not, email us directly at <a href="mailto:support@itfuturz.in">support@itfuturz.in</a>.</p>
                <button className="contact-btn-reset" onClick={() => setSent(false)}>Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <h3 className="contact-form-title">Send a message</h3>

                <div className="contact-form-row">
                  <div className="contact-field">
                    <label className="contact-label">Your Name</label>
                    <input
                      type="text" name="name" className="contact-input"
                      value={form.name} onChange={handleChange}
                      placeholder="Full name" required
                    />
                  </div>
                  <div className="contact-field">
                    <label className="contact-label">Email Address</label>
                    <input
                      type="email" name="email" className="contact-input"
                      value={form.email} onChange={handleChange}
                      placeholder="you@example.com" required
                    />
                  </div>
                </div>

                <div className="contact-field">
                  <label className="contact-label">Subject</label>
                  <input
                    type="text" name="subject" className="contact-input"
                    value={form.subject} onChange={handleChange}
                    placeholder="How can we help?" required
                  />
                </div>

                <div className="contact-field">
                  <label className="contact-label">Message</label>
                  <textarea
                    name="message" className="contact-input contact-textarea"
                    value={form.message} onChange={handleChange}
                    placeholder="Describe your issue or question in detail..."
                    rows={5} required
                  />
                </div>

                <button type="submit" className="contact-btn-submit">
                  <Send size={15} /> Send Message
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <p>© {new Date().getFullYear()} <a target='blank' href='https://itfuturz.in/#/home' className='font-bold underline'>It Futurz</a>. All rights reserved.</p>
          <div className="legal-footer-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
