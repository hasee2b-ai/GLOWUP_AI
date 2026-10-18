import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import Logo from './Logo.jsx'

const linkBase =
  'text-sm text-mute transition-colors hover:text-mist focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm'

const ColumnHeading = ({ children }) => (
  <h3 className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-mist/70">
    {children}
  </h3>
)

function FooterColumn({ heading, children, className = '' }) {
  return (
    <div className={className}>
      <ColumnHeading>{heading}</ColumnHeading>
      <ul className="mt-5 space-y-3.5 text-sm md:mt-4 md:space-y-2.5">{children}</ul>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface/60">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-y-10 lg:grid-cols-[1.25fr_1fr_1fr_1fr] lg:gap-x-10">
          {/* Column 1 — Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center">
              <Logo height={30} />
            </div>
            <p className="mt-5 text-sm leading-relaxed text-mute md:mt-4">
              Turn your ideas into beautiful AI-generated artwork.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-mute/80 md:mt-3">
              Images are generated on demand with AI. GlowUp AI does not store your
              creations permanently.
            </p>
          </div>

          {/* Column 2 — Create & Explore */}
          <FooterColumn heading="Create & Explore" className="lg:pl-10">
            <li>
              <Link to="/create" className={linkBase}>
                Create an Image
              </Link>
            </li>
            <li>
              <Link to="/#inspiration" className={linkBase}>
                Inspiration Gallery
              </Link>
            </li>
            <li>
              <Link to="/#styles" className={linkBase}>
                Creative Styles
              </Link>
            </li>
            <li>
              <Link to="/#how-it-works" className={linkBase}>
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/#gallery" className={linkBase}>
                Artwork Gallery
              </Link>
            </li>
          </FooterColumn>

          {/* Column 3 — About & Resources */}
          <FooterColumn heading="About & Resources">
            <li>
              <Link to="/#features" className={linkBase}>
                Why GlowUp AI
              </Link>
            </li>
            <li>
              <Link to="/" className={linkBase}>
                About the Studio
              </Link>
            </li>
            <li>
              <Link to="/#styles" className={linkBase}>
                Prompt Inspiration
              </Link>
            </li>
          </FooterColumn>

          {/* Column 4 — Studio & Support */}
          <FooterColumn heading="Studio & Support">
            <li>
              <Link to="/create" className={linkBase}>
                Open the Studio
              </Link>
            </li>
            <li>
              <Link to="/create" className={linkBase}>
                Image Generation
              </Link>
            </li>
            <li>
              <Link to="/#how-it-works" className={linkBase}>
                Getting Started
              </Link>
            </li>
          </FooterColumn>
        </div>
      </div>

      {/* Bottom legal bar */}
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-5 py-4 text-xs text-mute/80 sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} GlowUp AI. All rights reserved.</p>
          <p className="text-mute/70">
            Premium AI image generation
          </p>
        </div>
      </div>
    </footer>
  )
}
