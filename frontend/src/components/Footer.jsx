import { Link } from 'react-router-dom'
import { Sparkles, Github, Twitter } from 'lucide-react'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface/60">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center">
              <Logo height={32} />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-mute">
              Your imagination, beautifully generated. Turn simple words into
              extraordinary visuals with AI-powered image creation.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-mute/80">
              Image generation requires a configured provider API key. GlowUp AI
              does not store your generated images permanently.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-mist/70">
              Product
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/" className="text-mute hover:text-mist transition-colors">Home</Link></li>
              <li><Link to="/create" className="text-mute hover:text-mist transition-colors">Create</Link></li>
              <li><a href="/#features" className="text-mute hover:text-mist transition-colors">Features</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-mist/70">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="#privacy" className="text-mute hover:text-mist transition-colors">Privacy information</a></li>
              <li><a href="#terms" className="text-mute hover:text-mist transition-colors">Terms of use</a></li>
            </ul>
            <div className="mt-5 flex items-center gap-3">
              <a href="#" aria-label="GitHub" className="rounded-lg border border-border p-2 text-mute hover:border-primary/50 hover:text-mist transition-colors">
                <Github size={16} />
              </a>
              <a href="#" aria-label="Twitter" className="rounded-lg border border-border p-2 text-mute hover:border-primary/50 hover:text-mist transition-colors">
                <Twitter size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-mute/80 sm:flex-row">
          <p>© {new Date().getFullYear()} GlowUp AI. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" />
            Crafted with AI-powered creativity
          </p>
        </div>
      </div>
    </footer>
  )
}
