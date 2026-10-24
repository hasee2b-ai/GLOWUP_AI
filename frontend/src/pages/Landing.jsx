import { Link, useNavigate } from 'react-router-dom'
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
  Star,
  Package,
  Mountain,
  Home,
  Clapperboard,
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

const INSPIRATION = [
  { src: '/a-captivating-and-conceptual-artwork-fea_ERqVwBiAW_2iiF6lBe94ww_gPGjWTMySsyWyHmptrsg5A.webp', alt: 'Conceptual portrait blending a city skyline and a twilight landscape', label: 'Conceptual art' },
  { src: '/high-level-description-a-high-angle-stud_bl-WTI6mUPeJmuXS4f7-pA_feGrl4-BQpOtA7BVwK50RQ.webp', alt: 'A mask half-covered in vivid pink and purple florals', label: 'Mixed media' },
  { src: '/high-level-description-a-mixed-media-bus_FeVLi-AkWf65QR62ODyPwQ_w8IW6v1AR3aAKpLAfRjj7Q.webp', alt: 'An impressionist portrait with visible brushstrokes on a blush background', label: 'Editorial art' },
  { src: '/high-level-description-an-impressionisti_O_M6We2xXBmE9_mx0ee27A_AfD8_GQ0T62kRzDVyWm3rQ.webp', alt: 'An impressionist city street at dusk with wet pavement reflections', label: 'Cityscapes' },
]

const EXAMPLE_PROMPT = 'Close-up of an androgynous human face showing an expression of deep pain, created in a highly detailed origami technique with intricate paper folds, vibrant psychedelic colors.'

const STYLES = [
  { icon: Wand2, name: 'Fantasy', prompt: 'a majestic dragon coiled around a crystalline tower floating above a sea of clouds at twilight, epic fantasy digital painting' },
  { icon: Star, name: 'Anime', prompt: 'a cheerful anime girl with turquoise hair standing in a field of lavender under a pastel sunset, soft cel shading' },
  { icon: Package, name: 'Product photography', prompt: 'a minimalist product photograph of a matte black perfume bottle on a marble surface, soft studio lighting' },
  { icon: Mountain, name: 'Landscapes', prompt: 'a serene mountain lake at dawn with soft pastel peaks reflected in still water, cinematic depth' },
  { icon: Home, name: 'Interior design', prompt: 'a sunlit modern living room with floor-to-ceiling windows overlooking a calm ocean at golden hour' },
  { icon: Clapperboard, name: 'Cinematic', prompt: 'a lone astronaut standing on a rocky alien planet, two moons in the sky, cinematic film still, dramatic rim lighting, anamorphic lens flare' },
]

export default function Landing() {
  const navigate = useNavigate()

  const tryPrompt = (text) => {
    navigate(`/create?prompt=${encodeURIComponent(text)}`)
  }

  return (
    <div>
      {/* ------------------------------ HERO ------------------------------ */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-20">
          <Reveal variant="up" className="lg:col-span-5">
            <h1 className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-mist sm:text-5xl xl:text-[3.5rem]">
              Turn your ideas into images.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-mute sm:text-lg">
              Describe what you imagine. GlowUp AI brings it to life.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                to="/create"
                className="group inline-flex items-center gap-2 rounded-full bg-mist px-6 py-3 text-sm font-semibold text-ink transition-all hover:bg-mist/90 active:scale-[0.98]"
              >
                <Sparkles size={16} />
                Create Your Image
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-mist transition-colors hover:text-primary"
              >
                See how it works
                <ArrowRight size={14} />
              </a>
            </div>
          </Reveal>

          <Reveal variant="up" delay={150} className="lg:col-span-7">
            <div>
              <div className="overflow-hidden rounded-2xl border border-border shadow-lg shadow-mist/8">
                <img
                  src="/hero.webp"
                  alt="AI-generated artwork created with GlowUp AI"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <p className="mt-3 text-xs text-mute">
                Generated with GlowUp AI
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------- STYLE MARQUEE ------------------------- */}
      <Marquee />

      {/* ------------------------- CREATIVE STYLES ------------------------- */}
      <section id="styles" className="relative scroll-mt-24 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Creative styles
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Jump-start your next idea
            </h2>
            <p className="mt-4 text-mute">
              Choose a style to prefill a prompt, then edit it to make it yours
              before generating.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STYLES.map((s, i) => (
              <Reveal key={s.name} delay={i * 80} variant="up">
                <button
                  type="button"
                  onClick={() => tryPrompt(s.prompt)}
                  className="group flex h-full w-full items-start gap-4 rounded-2xl border border-border bg-surface p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 transition-transform duration-300 group-hover:scale-110">
                    <s.icon size={20} className="text-primary" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-base font-semibold text-mist">
                      {s.name}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-mute">
                      {s.prompt}
                    </span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
              A selection of visuals created in the studio. Drag to explore the arc, then click any piece to view it up close.
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
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              How it works
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Your imagination, in three simple steps.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-mute">
              From your first idea to a finished image, creating something beautiful is simple.
            </p>
          </Reveal>

          <div className="relative mt-12 grid gap-6 md:mt-16 md:grid-cols-3 md:gap-6 lg:gap-8">
            {/* Connecting line */}
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden md:block">
              <div className="relative h-px bg-gradient-to-r from-primary/25 via-primary/35 to-primary/25">
                <span className="absolute -top-[3px] left-1/4 h-[7px] w-[7px] rounded-full border-2 border-primary/30 bg-surface" />
                <span className="absolute -top-[3px] right-1/4 h-[7px] w-[7px] rounded-full border-2 border-primary/30 bg-surface" />
              </div>
            </div>

            {/* Step 01 — Describe */}
            <Reveal delay={0} variant="up">
              <div className="group relative h-full rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 sm:p-7">
                <div className="flex items-start justify-between">
                  <span className="font-display text-[2.5rem] font-extrabold leading-none tracking-tight text-primary/10 transition-colors duration-300 group-hover:text-primary/20 md:text-[3.25rem]">
                    01
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <PenLine size={17} />
                  </span>
                </div>

                {/* Prompt input preview */}
                <div className="mt-6 rounded-xl border border-border bg-surface-2/50 p-4">
                  <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3.5 py-2.5">
                    <Sparkles size={14} className="shrink-0 text-primary" />
                    <span className="truncate text-xs text-mute">
                      A serene mountain lake at dawn...
                    </span>
                    <span className="ml-auto h-3.5 w-px animate-pulse bg-primary/50" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                      Cinematic
                    </span>
                    <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-semibold text-secondary">
                      Fantasy
                    </span>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-[10px] font-medium text-mute ring-1 ring-border">
                      +4 more
                    </span>
                  </div>
                </div>

                <h3 className="mt-6 font-display text-lg font-semibold">Describe your idea</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">
                  Write a prompt or start with one of our curated examples.
                </p>
              </div>
            </Reveal>

            {/* Step 02 — Customize */}
            <Reveal delay={150} variant="up">
              <div className="group relative h-full rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 sm:p-7">
                <div className="flex items-start justify-between">
                  <span className="font-display text-[2.5rem] font-extrabold leading-none tracking-tight text-secondary/10 transition-colors duration-300 group-hover:text-secondary/20 md:text-[3.25rem]">
                    02
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary ring-1 ring-secondary/15">
                    <Settings2 size={17} />
                  </span>
                </div>

                {/* Settings preview */}
                <div className="mt-6 space-y-3.5 rounded-xl border border-border bg-surface-2/50 p-4">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-mute">
                      Aspect ratio
                    </span>
                    <div className="mt-1.5 flex gap-1.5">
                      <span className="rounded-md bg-primary/15 px-3 py-1.5 text-[10px] font-semibold text-primary">
                        1:1
                      </span>
                      <span className="rounded-md bg-surface px-3 py-1.5 text-[10px] font-medium text-mute ring-1 ring-border">
                        3:4
                      </span>
                      <span className="rounded-md bg-surface px-3 py-1.5 text-[10px] font-medium text-mute ring-1 ring-border">
                        4:3
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-mute">Enhance prompt</span>
                    <span className="flex h-[18px] w-8 items-center rounded-full bg-primary/70 px-0.5">
                      <span className="ml-auto h-3.5 w-3.5 rounded-full bg-white shadow-sm" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-mute">Watermark</span>
                    <span className="flex h-[18px] w-8 items-center rounded-full bg-border px-0.5">
                      <span className="h-3.5 w-3.5 rounded-full bg-white shadow-sm" />
                    </span>
                  </div>
                </div>

                <h3 className="mt-6 font-display text-lg font-semibold">Customize your creation</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">
                  Choose your aspect ratio, image count, and generation settings.
                </p>
              </div>
            </Reveal>

            {/* Step 03 — Generate & Download */}
            <Reveal delay={300} variant="up">
              <div className="group relative h-full rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 sm:p-7">
                <div className="flex items-start justify-between">
                  <span className="font-display text-[2.5rem] font-extrabold leading-none tracking-tight text-highlight/15 transition-colors duration-300 group-hover:text-highlight/25 md:text-[3.25rem]">
                    03
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-highlight/10 text-highlight ring-1 ring-highlight/15">
                    <Download size={17} />
                  </span>
                </div>

                {/* Image preview + download */}
                <div className="mt-6 rounded-xl border border-border bg-surface-2/50 p-4">
                  <div className="relative overflow-hidden rounded-lg">
                    <img
                      src="/card3image.webp"
                      alt="Generated image preview"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 shadow-md backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <Download size={14} className="text-mist" />
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="truncate text-[10px] font-medium text-mute">mountain-lake-dawn.png</span>
                    <span className="ml-2 shrink-0 text-[10px] font-semibold text-success">Ready</span>
                  </div>
                </div>

                <h3 className="mt-6 font-display text-lg font-semibold">Generate & download</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">
                  Bring your idea to life and save your finished image.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------- INSPIRATION ------------------------- */}
      <section id="inspiration" className="relative scroll-mt-24 overflow-hidden py-20 lg:py-28">
        {/* soft gradient wash */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-0 h-[500px] w-[600px] rounded-full bg-secondary/10 blur-[120px]" />
          <div className="absolute -bottom-32 left-0 h-[400px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <span className="h-px w-8 bg-primary/40" />
              Made with GlowUp AI
            </span>
            <h2 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-[1.15] tracking-tight text-mist sm:text-5xl">
              A little inspiration goes a long way.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-mute">
              Explore the kinds of worlds you can create with a single prompt.
            </p>
          </Reveal>

          {/* artwork cards */}
          <Reveal delay={120} className="mt-12">
            <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
              {INSPIRATION.map((item) => (
                <div key={item.src}>
                  <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <img
                      src={item.src}
                      alt={item.alt}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover"
                    />
                  </div>
                  <span className="mt-3 block text-sm font-medium text-mute">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          {/* prompt bar */}
          <Reveal delay={200} className="mt-14 flex justify-end">
            <div className="flex w-full max-w-xl flex-col items-stretch gap-4 rounded-2xl border border-border bg-surface/80 p-5 shadow-lg shadow-primary/5 backdrop-blur sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-5">
              <span className="flex flex-1 items-start gap-2.5 text-sm leading-relaxed text-mute sm:items-center">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
                <span className="break-words">{EXAMPLE_PROMPT}</span>
              </span>
              <button
                type="button"
                onClick={() => tryPrompt(EXAMPLE_PROMPT)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98]"
              >
                Try this prompt
                <ArrowRight size={15} />
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
