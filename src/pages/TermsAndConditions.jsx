import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import './LegalPages.css'

export default function TermsAndConditions() {
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
        <div className="legal-hero-icon"><FileText size={28} /></div>
        <h1 className="legal-hero-title">Terms &amp; Conditions</h1>
        <p className="legal-hero-sub">Last updated: April 2025</p>
      </div>

      <div className="legal-body">
        <div className="legal-container">

          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>By downloading, installing, or using the OnTrip mobile application or website ("Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Platform.</p>
          </section>

          <section className="legal-section">
            <h2>2. About OnTrip</h2>
            <p>OnTrip is a travel management platform that connects customers with travel agencies. It enables trip booking, itinerary management, live tracking, community chat, and document management for travelers and agencies.</p>
          </section>

          <section className="legal-section">
            <h2>3. User Accounts</h2>
            <ul>
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must be at least 18 years old to use this Platform.</li>
              <li>OnTrip reserves the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Booking &amp; Payments</h2>
            <ul>
              <li>All bookings are subject to availability and confirmation by the respective travel agency.</li>
              <li>Pricing is set by travel agencies and may vary. OnTrip is not responsible for pricing errors.</li>
              <li>Cancellation and refund policies are determined by the individual travel agency.</li>
              <li>OnTrip does not directly process payments and is not liable for payment disputes between customers and agencies.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Agency Responsibilities</h2>
            <ul>
              <li>Travel agencies are solely responsible for the accuracy of trip packages, itineraries, and pricing listed on the Platform.</li>
              <li>Agencies must complete KYC verification before their account becomes active.</li>
              <li>Agencies must comply with all applicable laws and regulations in their jurisdiction.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any unlawful purpose.</li>
              <li>Post false, misleading, or fraudulent content.</li>
              <li>Attempt to gain unauthorized access to any part of the Platform.</li>
              <li>Harass, abuse, or harm other users.</li>
              <li>Use automated tools to scrape or extract data from the Platform.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Intellectual Property</h2>
            <p>All content on the Platform, including logos, text, graphics, and software, is the property of OnTrip or its licensors and is protected by applicable intellectual property laws. You may not reproduce or distribute any content without prior written permission.</p>
          </section>

          <section className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>OnTrip is a technology platform and is not a travel agency. We are not liable for:</p>
            <ul>
              <li>Any loss or damage arising from bookings made through the Platform.</li>
              <li>Actions or omissions of travel agencies or vendors.</li>
              <li>Service interruptions, data loss, or technical errors.</li>
              <li>Any indirect, incidental, or consequential damages.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>9. Privacy</h2>
            <p>Your use of the Platform is also governed by our <Link to="/privacy-policy" className="legal-link">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms. We will notify users of significant changes via the app or email.</p>
          </section>

          <section className="legal-section">
            <h2>11. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</p>
          </section>

          <section className="legal-section">
            <h2>12. Contact</h2>
            <p>For questions about these Terms, please <Link to="/contact" className="legal-link">contact us</Link>.</p>
          </section>

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
