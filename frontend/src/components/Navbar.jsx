import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Sparkles, ArrowRight } from 'lucide-react'
import Logo from './Logo.jsx'

const linkBase =
  'text-sm font-medium text-mute hover:text-mist transition-colors px-1 py-1'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const goCreate = () => {
    setOpen(false)
    navigate('/create')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-ink/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link to="/" className="flex items-center" aria-label="GlowUp AI home">
          <Logo height={36} />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <NavLink to="/" end className={linkBase}>
            Home
          </NavLink>
          <a href="/#features" className={linkBase} onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault()
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
            }
          }}>
            Features
          </a>
          <a href="/#how-it-works" className={linkBase} onClick={(e) => {
            if (window.location.pathname === '/') {
              e.preventDefault()
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }
          }}>
            How it works
          </a>
          <NavLink to="/create" className={linkBase}>
            Create
          </NavLink>
        </div>

        <div className="hidden md:block">
          <button
            onClick={goCreate}
            className="group inline-flex items-center gap-2 rounded-full bg-mist px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:bg-mist/90 active:scale-[0.98]"
          >
            Start Creating
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center justify-center rounded-lg p-2 text-mist hover:bg-mist/5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/60 bg-ink/95 px-5 pb-5 pt-2 md:hidden animate-fade-in">
          <div className="flex flex-col gap-1">
            <NavLink to="/" end onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-mute hover:bg-mist/5 hover:text-mist">
              Home
            </NavLink>
            <a href="/#features" onClick={(e) => { e.preventDefault(); setOpen(false); navigate('/'); setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 50) }} className="rounded-lg px-3 py-2.5 text-sm font-medium text-mute hover:bg-mist/5 hover:text-mist">
              Features
            </a>
            <a href="/#how-it-works" onClick={(e) => { e.preventDefault(); setOpen(false); navigate('/'); setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }), 50) }} className="rounded-lg px-3 py-2.5 text-sm font-medium text-mute hover:bg-mist/5 hover:text-mist">
              How it works
            </a>
            <NavLink to="/create" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-mute hover:bg-mist/5 hover:text-mist">
              Create
            </NavLink>
            <button
              onClick={goCreate}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white"
            >
              <Sparkles size={16} />
              Start Creating
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
