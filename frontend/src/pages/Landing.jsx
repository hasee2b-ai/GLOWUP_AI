import { Link } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  Wand2,
  SlidersHorizontal,
  Image as ImageIcon,
  Layers,
  PenLine,
  Settings2,
  Download,
  ChevronDown,
} from 'lucide-react'
import Gallery from '../components/Gallery.jsx'
import Reveal from '../components/Reveal.jsx'
import Marquee from '../components/Marquee.jsx'

const FEATURES = [
  {
    icon: Wand2,
    title: 'Text to Image',
    desc: 'Transform detailed descriptions into stunning, high-resolution visuals in seconds.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Creative Control',
    desc: 'Choose aspect ratios, image counts, and generation options that shape your result.',
  },
  {
    icon: ImageIcon,
    title: 'High-Quality Results',
    desc: 'Preview every generation and download your favorites with a single click.',
  },
  {
    icon: Layers,
    title: 'Your Creative Workspace',
    desc: 'Generate multiple images and revisit recent results during your session.',
  },
]

const STEPS = [
  {
    icon: PenLine,
    step: '01',
    title: 'Describe your idea',
    desc: 'Type a prompt or pick one of our curated examples to get started.',
  },
  {
    icon: Settings2,
    step: '02',
    title: 'Customize settings',
    desc: 'Tune the aspect ratio, image count, and generation options.',
  },
  {
    icon: Download,
    step: '03',
    title: 'Generate & download',
    desc: 'Watch your idea come to life, then save it straight to your device.',
  },
]

export default function Landing() {
  return (
    <div>
      {/* ------------------------------ HERO ------------------------------ */}
      <section className="relative overflow-hidden">
        {/* soft gradient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-40 -left-32 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[100px]" />
          <div className="absolute top-60 -right-32 h-[350px] w-[350px] rounded-full bg-highlight/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-2 lg:pb-28 lg:pt-24">
          <Reveal variant="right">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles size={14} />
              AI Image Generation
            </span>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Your imagination,
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                beautifully
              </span>
              <br />
              brought to life.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-mute">
              Transform simple words into extraordinary visuals. GlowUp AI turns
              your text prompts into stunning, high-quality images in seconds.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/create"
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-secondary px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
              >
                <Sparkles size={18} />
                Create Your Image
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-7 py-3.5 text-base font-semibold text-mist shadow-sm transition-all hover:border-primary/50 hover:bg-surface-2"
              >
                Explore the Studio
              </a>
            </div>
          </Reveal>

          <Reveal variant="left" delay={150} className="lg:pl-6">
            <div className="group relative cursor-pointer overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-2xl shadow-primary/10 transition-all duration-300 hover:border-primary/40">
              <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-secondary/15 blur-2xl" />
              <img
                src="/gallery-1.jpg"
                alt="Featured generated artwork"
                className="relative aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:aspect-[3/4]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent p-6 pt-16">
                <span className="text-xs font-medium uppercase tracking-wider text-mute">
                  Featured artwork
                </span>
                <p className="mt-1 font-display text-lg font-semibold text-mist">
                  Generated with GlowUp AI
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* scroll indicator */}
        <div className="relative flex justify-center pb-8">
          <a
            href="#features"
            aria-label="Scroll to features"
            className="flex flex-col items-center gap-1.5 text-mute transition-colors hover:text-mist"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Scroll</span>
            <ChevronDown size={18} className="animate-bounce" />
          </a>
        </div>
      </section>

      {/* ------------------------- STYLE MARQUEE ------------------------- */}
      <Marquee />

      {/* ---------------------------- GALLERY ---------------------------- */}
      <section id="gallery" className="relative scroll-mt-24 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Gallery
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Artwork generated with GlowUp AI
            </h2>
            <p className="mt-4 text-mute">
              A selection of visuals created in the studio. Click any image to view it up close.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-14">
            <Gallery />
          </Reveal>
        </div>
      </section>

      {/* ---------------------------- FEATURES ---------------------------- */}
      <section id="features" className="relative scroll-mt-24 border-t border-border/60 bg-surface/50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Features
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to create
            </h2>
            <p className="mt-4 text-mute">
              A focused toolkit designed to take you from a rough idea to a
              finished visual.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100} variant="up">
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                  {/* gradient top border on hover */}
                  <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 ring-1 ring-border transition-transform duration-300 group-hover:scale-110">
                    <f.icon size={22} className="text-primary" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------- HOW IT WORKS -------------------------- */}
      <section id="how-it-works" className="relative scroll-mt-24 border-t border-border/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              How it works
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              From idea to image in three steps
            </h2>
          </Reveal>

          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            {/* connecting line */}
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 md:block" />
            {STEPS.map((s, i) => (
              <Reveal key={s.step} delay={i * 150} variant="up">
                <div className="relative h-full rounded-2xl border border-border bg-surface p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 ring-1 ring-border">
                    <s.icon size={28} className="text-secondary" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-display text-xs font-bold text-white shadow-lg shadow-primary/20">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- FINAL CTA ----------------------------- */}
      <section className="relative scroll-mt-24 border-t border-border/60 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal variant="scale">
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-primary/10 via-surface to-secondary/10 px-8 py-16 text-center shadow-xl shadow-primary/5 sm:px-16 lg:py-20">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]" />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Ready to bring your ideas to life?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-mute">
                  Open the studio, describe what you imagine, and let GlowUp AI
                  handle the rest.
                </p>
                <Link
                  to="/create"
                  className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-secondary px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/20 transition-all hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
                >
                  <Sparkles size={18} />
                  Start Creating
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
