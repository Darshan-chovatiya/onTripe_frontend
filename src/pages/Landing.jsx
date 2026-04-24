import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Globe, Zap, Shield, Star, MapPin, Users, Calendar, CheckCircle, Plane, MessageSquare, BarChart3, Lock } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getRoleRedirectPath } from '@/shared/utils/roleHelpers.js'
import logo from '@/assets/onTripLogo.png'
import './Landing.css'

const HOW_IT_WORKS = [
  { num: '01', icon: Users, title: 'Create your agency', desc: 'Register and set up your travel agency profile in minutes. Add your team and configure roles.' },
  { num: '02', icon: Calendar, title: 'Build trip packages', desc: 'Design beautiful trip packages with itineraries, pricing, and vendor assignments.' },
  { num: '03', icon: Plane, title: 'Manage & track', desc: 'Real-time booking management, live trip tracking, and automated customer communication.' },
]

const APP_FEATURES = [
  { icon: MessageSquare, title: 'Group Chat per Trip', desc: 'Every booking gets a dedicated community chat along with the  Agents and travelers.' },
  { icon: BarChart3, title: 'Day-Wise Itinerary', desc: 'Structured day-by-day plans with pickup times, activities, and driver details  all in one place.' },
  { icon: CheckCircle, title: 'Download Vouchers', desc: 'Keep all tickets and vouchers in one place. Offline access included for travelers on the go.' },
  { icon: MapPin, title: 'Live Trip Tracking', desc: 'Real-time status updates for every booking. Customers always know where they stand.' },
  { icon: Lock, title: 'Role-Based Access', desc: 'Granular permissions for admin, parent agency, child agency, sub-child, vendor and customer.' },
  { icon: Zap, title: 'Instant Notifications', desc: 'Push notifications for  messages, booking and important alerts never miss a beat.' },
]

const DESTINATIONS = [
  { name: 'Maldives', tag: 'Beach', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80' },
  { name: 'Kyoto', tag: 'Culture', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80' },
  { name: 'Santorini', tag: 'Luxury', img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80' },
  { name: 'Bali', tag: 'Adventure', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
]

const TESTIMONIALS = [
  { quote: 'This platform completely transformed our travel operations. Managing bookings and vendors has never been easier.', name: 'Arjun Mehta', role: 'CEO, TravelX' },
  { quote: 'Clean UI, powerful backend. The group chat and live tracking features are exactly what our customers needed.', name: 'Priya Shah', role: 'CTO, Wanderlust Co.' },
  { quote: 'Managing vendors and bookings is now effortless. The role-based access saved us hours every week.', name: 'Ravi Patel', role: 'Ops Head, JourneyPlus' },
]

export default function Landing() {
  const { isAuthenticated, user, isCheckingAuth } = useAuth()
  const dashboardHref = user?.role ? getRoleRedirectPath(user.role) : '/login'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="ont-root">
      <nav className={`ont-nav${scrolled ? ' ont-nav-scrolled' : ''}`}>
        <div className="ont-nav-inner">
          <img src={logo} className="ont-logo" alt="OnTrip" />
          <div className="ont-nav-links">
            <a href="#features" className="ont-nav-link">Features</a>
            <a href="#how" className="ont-nav-link">How it works</a>
            <a href="#destinations" className="ont-nav-link">Destinations</a>
            <a href="#testimonials" className="ont-nav-link">Reviews</a>
          </div>
          <div className="ont-nav-actions">
            <Link to="/login" className="ont-btn-ghost ont-btn-sm">Agency Login</Link>
            {!isCheckingAuth && isAuthenticated ? (
              <Link to={dashboardHref} className="ont-btn-primary">Dashboard <ArrowRight size={14} /></Link>
            ) : (
              <Link to="/customer/login" className="ont-btn-primary">Get Started <ArrowRight size={14} /></Link>
            )}
          </div>
        </div>
      </nav>

      {/* â”€â”€ HERO â”€â”€ */}
      <section className="ont-hero">
        {/* Full-bleed background image with overlay */}
        <div className="ont-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1800&q=85"
            alt=""
            className="ont-hero-bg-img"
          />
          <div className="ont-hero-overlay" />
        </div>

        <div className="ont-hero-inner">
          <div className="ont-badge">Trusted by 500+ Travel Agencies</div>
          <h1 className="ont-hero-title">
            Start Your Journey to<br />
            <span className="ont-hero-accent">Your Dream Destination</span>
          </h1>
          <p className="ont-hero-sub">
            A complete platform built for modern travel businesses  powerful, elegant, and ready to scale.
          </p>
          <div className="ont-hero-cta">
            <Link to="/customer/login" className="ont-btn-white ont-btn-lg">
              Book a Trip Now <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="ont-btn-outline-white ont-btn-lg">
              Agency Access
            </Link>
          </div>
        </div>

        {/* Floating glass cards */}
        <div className="ont-float-card ont-float-1">
          <div className="ont-float-dot" />
          <div>
            <div className="ont-float-title">New booking confirmed</div>
            <div className="ont-float-sub">Maldives Â· 5 nights Â· 4 travelers</div>
          </div>
          <div className="ont-float-amount">84,000</div>
        </div>
        <div className="ont-float-card ont-float-2">
          <Star size={14} className="ont-float-star" fill="#F59E0B" />
          <div>
            <div className="ont-float-title">4.9 / 5 Rating</div>
            <div className="ont-float-sub">From 2,400+ reviews</div>
          </div>
        </div>
        <div className="ont-float-card ont-float-3">
          <MapPin size={14} style={{ color: '#3B2FA3', flexShrink: 0 }} />
          <div>
            <div className="ont-float-title">Live tracking active</div>
            <div className="ont-float-sub">Kyoto Tour Â· Day 3</div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="ont-hero-stats-bar">
          {[['500+', 'Agencies'], ['2M+', 'Bookings'], ['99.9%', 'Uptime'], ['150+', 'Destinations']].map(([num, label]) => (
            <div key={label} className="ont-stat-item">
              <span className="ont-stat-num">{num}</span>
              <span className="ont-stat-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="ont-marquee-wrap">
        <div className="ont-marquee-track">
          {['Booking Management', 'Vendor Control', 'Smart Invoicing', 'Real-time Reports', 'Role Access', 'Trip Tracking', 'Customer Portal', 'Group Chat', 'Push Notifications', 'KYC Verification'].concat(['Booking Management', 'Vendor Control', 'Smart Invoicing', 'Real-time Reports', 'Role Access', 'Trip Tracking', 'Customer Portal', 'Group Chat', 'Push Notifications', 'KYC Verification']).map((item, i) => (
            <span key={i} className="ont-marquee-item">
              <span className="ont-marquee-dot"></span> {item}
            </span>
          ))}
        </div>
      </div>

      <section className="ont-section" id="features">
        <div className="ont-container">
          <div className="ont-section-label">Why OnTrip</div>
          <h2 className="ont-section-title">Everything your travel business needs</h2>
          <p className="ont-section-sub">One platform to manage it all  from customer bookings to vendor operations.</p>

          <div className="ont-app-features-grid">
            {APP_FEATURES.map((f) => (
              <div key={f.title} className="ont-app-feature-card">
                <div className="ont-app-feature-icon">
                  <f.icon size={20} />
                </div>
                <h3 className="ont-app-feature-title">{f.title}</h3>
                <p className="ont-app-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ HOW IT WORKS â”€â”€ */}
      <section className="ont-section ont-section-dark" id="how">
        <div className="ont-container">
          <div className="ont-section-label ont-label-light">How it works</div>
          <h2 className="ont-section-title ont-title-light">Up and running in minutes</h2>
          <p className="ont-section-sub ont-sub-light">Three simple steps to transform your travel business.</p>

          <div className="ont-how-grid">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.num} className="ont-how-card">
                <div className="ont-how-num">{step.num}</div>
                <div className="ont-how-icon-wrap">
                  <step.icon size={22} />
                </div>
                <h3 className="ont-how-title">{step.title}</h3>
                <p className="ont-how-desc">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className="ont-how-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ DESTINATIONS â”€â”€ */}
      <section className="ont-section" id="destinations">
        <div className="ont-container">
          <div className="ont-section-label">Popular Destinations</div>
          <h2 className="ont-section-title">Handpicked trips, wherever you dream</h2>
          <p className="ont-section-sub">Explore packages curated by top agencies on the platform.</p>

          <div className="ont-dest-grid">
            {DESTINATIONS.map((d) => (
              <div key={d.name} className="ont-dest-card">
                <img src={d.img} alt={d.name} className="ont-dest-img" loading="lazy" />
                <div className="ont-dest-overlay" />
                <div className="ont-dest-tag">{d.tag}</div>
                <div className="ont-dest-info">
                  <div className="ont-dest-name">{d.name}</div>
                  <Link to="/customer/login" className="ont-dest-btn">
                    Explore <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ APP SHOWCASE â”€â”€ */}
      <section className="ont-section ont-section-alt">
        <div className="ont-container ont-showcase-wrap">
          {/* Phone mockup */}
          <div className="ont-phone-wrap">
            <div className="ont-phone">
              <div className="ont-phone-notch" />
              <div className="ont-phone-screen">
                <div className="ont-phone-header">
                  <div className="ont-phone-avatar">K</div>
                  <div>
                    <div className="ont-phone-trip-name">Kyoto Cultural Tour</div>
                    <div className="ont-phone-trip-sub">Day 2 Â· 1 Sep</div>
                  </div>
                  <div className="ont-phone-status">Live</div>
                </div>
                <div className="ont-phone-card">
                  <div className="ont-phone-card-label">Pickup at 10:30 AM</div>
                  <div className="ont-phone-card-detail">Hotel Lobby Â· Driver: Rahul | OD1234</div>
                </div>
                <div className="ont-phone-section-title">Your Tickets</div>
                <div className="ont-phone-ticket">
                  <div className="ont-phone-ticket-icon"></div>
                  <div>
                    <div className="ont-phone-ticket-name">Fushimi Inari Tour</div>
                    <div className="ont-phone-ticket-size">PDF Â· 32 KB</div>
                  </div>
                  <div className="ont-phone-ticket-dl"></div>
                </div>
                <div className="ont-phone-ticket">
                  <div className="ont-phone-ticket-icon"></div>
                  <div>
                    <div className="ont-phone-ticket-name">Arashiyama Bamboo</div>
                    <div className="ont-phone-ticket-size">PDF Â· 28 KB</div>
                  </div>
                  <div className="ont-phone-ticket-dl"></div>
                </div>
                <div className="ont-phone-section-title" style={{ marginTop: '12px' }}>Group Chat</div>
                <div className="ont-phone-chat">
                  <div className="ont-phone-msg ont-msg-other">Ready for today!</div>
                  <div className="ont-phone-msg ont-msg-self">Bus arrives in 10 mins</div>
                  <div className="ont-phone-msg ont-msg-other">Perfect, we're in lobby</div>
                </div>
              </div>
              <div className="ont-phone-home-bar" />
            </div>
          </div>

          {/* Feature list */}
          <div className="ont-showcase-features">
            <div className="ont-section-label">Mobile Experience</div>
            <h2 className="ont-section-title" style={{ marginBottom: '8px' }}>Everything in your pocket</h2>
            <p className="ont-section-sub">Travelers get a beautiful app-like experience with real-time updates.</p>
            {[
              { icon: Calendar, title: 'Day-Wise Itinerary', desc: 'Structured plans with pickup times, activities, and driver details.' },
              { icon: CheckCircle, title: 'Download Vouchers', desc: 'All tickets in one place â€” offline access included.' },
              { icon: MessageSquare, title: 'Trip Group Chat', desc: 'Stay connected with your group and agent throughout the journey.' },
              { icon: MapPin, title: 'Live Trip Tracking', desc: 'Real-time status updates so travelers always know what\'s next.' },
            ].map((f) => (
              <div key={f.title} className="ont-showcase-item">
                <div className="ont-showcase-icon">
                  <f.icon size={18} />
                </div>
                <div>
                  <div className="ont-showcase-item-title">{f.title}</div>
                  <div className="ont-showcase-item-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ont-section" id="testimonials">
        <div className="ont-container">
          <div className="ont-section-label">Testimonials</div>
          <h2 className="ont-section-title">Loved by travel pros</h2>

          <div className="ont-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="ont-testimonial-card">
                <p className="ont-testimonial-quote">"{t.quote}"</p>
                <div className="ont-testimonial-author">
                  <div className="ont-testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <div className="ont-testimonial-name">{t.name}</div>
                    <div className="ont-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA BANNER â”€â”€ */}
      <section className="ont-cta-banner">
        <div className="ont-cta-bg">
          <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80" alt="" className="ont-cta-bg-img" />
          <div className="ont-cta-overlay" />
        </div>
        <div className="ont-container ont-cta-inner">
          <div className="ont-badge ont-badge-light">Join 500+ agencies today</div>
          <h2 className="ont-cta-title">Ready to transform your<br />travel business?</h2>
          <p className="ont-cta-sub">Start for free. No credit card required.</p>
          <div className="ont-cta-btns">
            <Link to="/customer/login" className="ont-btn-white ont-btn-lg">
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="ont-btn-outline-white ont-btn-lg">
              Agency Login
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ FOOTER â”€â”€ */}
      <footer className="ont-footer">
        <div className="ont-container ont-footer-inner">
          <p className="ont-footer-copy">@<a target='blank' href='https://itfuturz.in/#/home' className='font-bold underline'>It Futurz</a> All rights reserved.</p>
          <div className="ont-footer-links">
            <Link to="/privacy-policy" className="ont-footer-link">Privacy</Link>
            <Link to="/terms" className="ont-footer-link">Terms</Link>
            <Link to="/contact" className="ont-footer-link">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
