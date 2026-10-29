import { useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Logo from './Logo.jsx'
import StaggeredMenu from './StaggeredMenu.jsx'
import StarBorder from './StarBorder.jsx'

const linkBase =
  'text-sm font-medium text-mist hover:text-primary transition-colors px-1 py-1'

// Entries shown inside the StaggeredMenu panel (mobile only).
const MENU_ITEMS = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
  { label: 'Features', ariaLabel: 'View features', link: '/#features' },
  { label: 'How it works', ariaLabel: 'See how it works', link: '/#how-it-works' },
  { label: 'Create', ariaLabel: 'Open the creation studio', link: '/create' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const headerRef = useRef(null)
  const [merged, setMerged] = useState(pathname === '/')

  // Expose live navbar height so the hero can pull up exactly underneath it.
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return undefined
    const apply = () =>
      document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Transparent only at the very top of the landing page (hero sits behind it);
  // frosted bar returns on scroll or any other route so content stays legible.
  useLayoutEffect(() => {
    const update = () =>
      setMerged(pathname === '/' && window.scrollY <= 64 && !!document.getElementById('hero'))
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [pathname])

  const goCreate = () => {
    navigate('/create')
  }

  // Panel links are plain <a> elements; keep the app's SPA behaviour
  // (smooth-scroll for same-page section links, client-side route changes).
  const handleMenuItemClick = (item, _index, event) => {
    event?.preventDefault?.()
    if (item.link.startsWith('/#')) {
      const id = item.link.slice(2)
      if (window.location.pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        return
      }
      navigate('/')
      window.setTimeout(
        () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }),
        80
      )
      return
    }
    navigate(item.link)
  }

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        merged
          ? 'border-transparent bg-transparent'
          : 'border-border/60 bg-ink/80 backdrop-blur-xl'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link to="/" className="flex items-center" aria-label="GlowUp AI home">
          <Logo height={36} />
        </Link>

        {/* Desktop nav — hidden on the Create page, where only the logo stays. */}
        {pathname !== '/create' && (
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
        )}

        {/* Hidden on the Create page: only the logo stays. */}
        {pathname !== '/create' && (
          <div className="hidden md:block">
            <StarBorder
              onClick={goCreate}
              className="group focus-visible:outline-[color:var(--color-primary)]!"
            >
              Start Creating
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </StarBorder>
          </div>
        )}
      </nav>

      {/*
        Mobile menu: React Bits StaggeredMenu replaces the old hamburger +
        dropdown (visible below md, desktop nav above is untouched).
        The wrapper spans the viewport from the navbar down so the panel opens
        full-height; it is click-through, while the toggle and the panel opt
        back in. overflow-hidden clips the panel/prelayers that park off the
        right edge while closed (the non-fixed mode has no clipping of its own).
      */}
      {pathname !== '/create' && (
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[100dvh] overflow-hidden md:hidden">
        <StaggeredMenu
          position="right"
          items={MENU_ITEMS}
          displaySocials={false}
          displayItemNumbering
          colors={['#e9dfff', '#8b5cf6']}
          accentColor="#8b5cf6"
          menuButtonColor="#242033"
          openMenuButtonColor="#242033"
          logoUrl="/logo-full.webp"
          className="navbar-stagger"
          onItemClick={handleMenuItemClick}
        />
      </div>
      )}
    </header>
  )
}
