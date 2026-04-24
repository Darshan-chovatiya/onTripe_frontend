import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import './LegalPages.css'

export default function PrivacyPolicy() {
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
        <div className="legal-hero-icon"><Shield size={28} /></div>
        <h1 className="legal-hero-title">Privacy Policy</h1>
        <p className="legal-hero-sub">Last updated: April 2025</p>
      </div>

      <div className="legal-body">
        <div className="legal-container">

          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>OnTrip ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.</p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <h3>Information you provide directly:</h3>
            <ul>
              <li>Name, phone number, and email address when registering.</li>
              <li>KYC documents (Aadhaar, PAN) for agency verification.</li>
              <li>Profile information and preferences.</li>
              <li>Messages sent in community chats.</li>
            </ul>
            <h3>Information collected automatically:</h3>
            <ul>
              <li>Device information (model, OS version, unique device identifiers).</li>
              <li>Usage data (pages visited, features used, time spent).</li>
              <li>Push notification tokens (FCM) for sending alerts — customers only.</li>
              <li>Log data including IP address and access times.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To create and manage your account.</li>
              <li>To process and manage trip bookings.</li>
              <li>To send booking confirmations, OTPs, and important notifications.</li>
              <li>To enable real-time trip tracking and community chat.</li>
              <li>To verify agency identity through KYC.</li>
              <li>To improve our Platform and user experience.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Sharing of Information</h2>
            <p>We do not sell your personal information. We may share your data with:</p>
            <ul>
              <li><strong>Travel Agencies:</strong> Your booking details are shared with the agency managing your trip.</li>
              <li><strong>Service Providers:</strong> Third-party services for SMS (OTP), email delivery, and push notifications.</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide services. KYC documents are retained as required by applicable regulations. You may request deletion of your account and associated data by contacting us.</p>
          </section>

          <section className="legal-section">
            <h2>6. Push Notifications</h2>
            <p>If you are a customer using the OnTrip mobile app, we may send push notifications for booking updates, trip alerts, and community messages. You can disable notifications at any time through your device settings.</p>
          </section>

          <section className="legal-section">
            <h2>7. Data Security</h2>
            <p>We implement industry-standard security measures including encrypted data transmission (HTTPS), hashed passwords, and access controls. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section className="legal-section">
            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and data.</li>
              <li>Opt out of marketing communications.</li>
            </ul>
            <p>To exercise these rights, please <Link to="/contact" className="legal-link">contact us</Link>.</p>
          </section>

          <section className="legal-section">
            <h2>9. Children's Privacy</h2>
            <p>Our Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children.</p>
          </section>

          <section className="legal-section">
            <h2>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via the app or email. Continued use of the Platform after changes constitutes acceptance.</p>
          </section>

          <section className="legal-section">
            <h2>11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please <Link to="/contact" className="legal-link">contact us</Link>.</p>
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
