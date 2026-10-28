import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'

/**
 * Coverflow carousel for the landing page feature cards.
 *
 * Cards are laid out from a single motion value (`pos`) that eases toward an
 * integer target: the centre card sits at full size, its neighbours shrink to
 * REST_SCALE and slide toward the edges, the rest fade out. The whole card is
 * scaled with a transform (never a reflow), so the text inside scales with it.
 *
 * Interaction: arrows, dot buttons, ← / → keys, click a side card to centre it,
 * and pointer/touch drag to scrub. Autoplay pauses on hover and is disabled
 * entirely under prefers-reduced-motion.
 */

const RENDER_RANGE = 6
const REST_SCALE = 0.6
const CARD_RADIUS = 18
const MOVE_DURATION = 0.55
const DWELL = 3.2

/** Signed offset of a card from the centre, wrapping around the ends. */
function relOf(index, pos, count) {
  let rel = (((index - pos) % count) + count) % count
  if (rel > count / 2) rel -= count
  return rel
}

/** 0 at the centre, 1 from the first neighbour outward. */
function blendOf(rel) {
  return Math.min(Math.abs(rel), 1)
}

/** Horizontal offset (of the card centre) for a signed card offset. */
function xForRel(rel, sizing) {
  const { activeWidth, restWidth, gap } = sizing
  const ar = Math.abs(rel)
  const first = activeWidth / 2 + gap + restWidth / 2
  const pitch = restWidth + gap
  const mag = ar <= 1 ? ar * first : first + (ar - 1) * pitch
  return (rel < 0 ? -1 : 1) * mag
}

/**
 * Card geometry derived from the measured container width.
 *
 * Phones crop the neighbours — that is the coverflow look — so the centre card
 * gets 68% of the stage. Wider screens are capped so the whole three-card row
 * fits inside the stage (`trioFit`), which keeps neighbour text uncut. When a
 * neighbour still has to be cropped the text is faded out and only the icon
 * stays, so no card ever shows half a word.
 */
function sizingFor(width) {
  const narrow = width < 640
  const gap = narrow ? 16 : 28
  const trioFit = (width / 2 - gap) / 1.1
  const target = narrow
    ? Math.min(440, width * 0.68, width * 0.78)
    : Math.min(440, width * 0.5, width * 0.78, trioFit)
  const activeWidth = Math.round(Math.max(narrow ? 200 : 240, target))
  const compact = activeWidth < 340
  const activeHeight = Math.max(
    Math.round(activeWidth / (compact ? 1.2 : 1.4)),
    compact ? 210 : 240
  )
  const restWidth = Math.round(activeWidth * REST_SCALE)
  return {
    narrow,
    compact,
    gap,
    activeWidth,
    activeHeight,
    restWidth,
    restHeight: Math.round(activeHeight * REST_SCALE),
    sideFace: 1.1 * activeWidth + gap <= width / 2 + 1,
    // Free space left of the trio — overlay arrows only fit when there is some.
    edgeRoom: Math.floor(width / 2 - (1.1 * activeWidth + gap)),
  }
}

function FeatureFace({ item, compact, textOpacity }) {
  const Icon = item.icon
  return (
    <div className={`relative flex h-full flex-col justify-center ${compact ? 'p-5' : 'p-7'}`}>
      <span
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 ring-1 ring-border ${
          compact ? 'h-9 w-9' : 'h-12 w-12'
        }`}
      >
        <Icon size={compact ? 17 : 22} className="text-primary" />
      </span>
      <motion.div style={{ opacity: textOpacity }}>
        <h3 className={`mt-4 font-display font-semibold tracking-tight ${compact ? 'text-base' : 'text-xl'}`}>
          {item.title}
        </h3>
        <p className={`mt-2 leading-relaxed text-mute ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
          {item.desc}
        </p>
      </motion.div>
    </div>
  )
}

function Card({ item, index, pos, count, R, sizing, activeIdx, onSelect }) {
  const { sideFace } = sizing
  const x = useTransform(pos, (p) => xForRel(relOf(index, p, count), sizing))
  const scale = useTransform(pos, (p) =>
    1 - blendOf(relOf(index, p, count)) * (1 - REST_SCALE)
  )
  const opacity = useTransform(pos, (p) => {
    const ar = Math.abs(relOf(index, p, count))
    const fade = ar <= R ? 1 : ar >= R + 1 ? 0 : 1 - (ar - R)
    const dim = 1 - 0.32 * Math.min(ar, 1)
    return fade * dim
  })
  // Cropped neighbours keep the icon but drop the copy, so no card is ever
  // sliced through the middle of a sentence.
  const textOpacity = useTransform(pos, (p) => {
    if (sideFace) return 1
    const ar = Math.abs(relOf(index, p, count))
    return Math.max(0, Math.min(1, (0.5 - ar) / 0.25))
  })
  const zIndex = useTransform(pos, (p) =>
    Math.round(1000 - Math.abs(relOf(index, p, count)) * 100)
  )
  const glow = useTransform(pos, (p) => 1 - blendOf(relOf(index, p, count)))
  const boxShadow = useTransform(pos, (p) => {
    const a = blendOf(relOf(index, p, count))
    const ring = a < 0.5 ? 'rgba(139,92,246,0.35)' : 'rgba(233,229,242,0.9)'
    const y = (26 - 12 * a).toFixed(1)
    const blur = (58 - 26 * a).toFixed(1)
    const spread = (22 - 8 * a).toFixed(1)
    const alpha = (0.3 - 0.15 * a).toFixed(3)
    return `0 ${y}px ${blur}px -${spread}px rgba(36,32,51,${alpha}), inset 0 0 0 1px ${ring}`
  })

  const distance = Math.abs(index - activeIdx) % count
  const wrapped = Math.min(distance, count - distance)
  const hidden = wrapped > R

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        x,
        zIndex,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        onClick={onSelect}
        className="group/coverflow relative overflow-hidden rounded-[18px] border border-border bg-surface"
        style={{
          x: '-50%',
          y: '-50%',
          width: sizing.activeWidth,
          height: sizing.activeHeight,
          scale,
          borderRadius: CARD_RADIUS,
          boxShadow,
          pointerEvents: hidden ? 'none' : 'auto',
          cursor: onSelect ? 'pointer' : 'default',
        }}
      >
        <FeatureFace item={item} compact={sizing.compact} textOpacity={textOpacity} />
        {/* the centre card lights up along its top edge */}
        <motion.span
          style={{ opacity: glow }}
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
        />
      </motion.div>
    </motion.div>
  )
}

function ArrowButton({ side, size, label, inline, onClick }) {
  const isLeft = side === 'left'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={
        inline
          ? { width: size, height: size, flexShrink: 0 }
          : {
              position: 'absolute',
              top: '50%',
              [side]: 0,
              width: size,
              height: size,
              zIndex: 2000,
            }
      }
      className={`flex items-center justify-center rounded-full border border-border bg-surface text-mist shadow-md transition-all duration-200 hover:border-primary/40 hover:text-primary active:scale-95 ${
        inline ? '' : '-translate-y-1/2'
      }`}
    >
      <svg
        width={size * 0.42}
        height={size * 0.42}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {isLeft ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  )
}

export default function CoverflowFeatures({ items, autoplay = true, className = '' }) {
  const count = items.length
  const reducedMotion = useReducedMotion()

  const [width, setWidth] = useState(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const stageRef = useRef(null)

  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return undefined
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width))
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const sizing = useMemo(() => sizingFor(width), [width])
  const R = Math.max(1, Math.min(RENDER_RANGE, Math.floor(count / 2) - 1))

  const pos = useMotionValue(0)
  const targetRef = useRef(0)
  const rafRef = useRef(null)
  const lastTRef = useRef(null)
  const draggingRef = useRef(false)
  const dragStateRef = useRef(null)
  const lastDragEndRef = useRef(0)
  const pausedRef = useRef(false)
  const autoplayRef = useRef(false)
  const dwellAccRef = useRef(0)
  const moveDurRef = useRef(MOVE_DURATION)
  const dwellRef = useRef(DWELL)
  const reducedRef = useRef(Boolean(reducedMotion))

  moveDurRef.current = reducedMotion ? 0.08 : MOVE_DURATION
  dwellRef.current = DWELL
  reducedRef.current = Boolean(reducedMotion)

  const tick = useCallback(
    (t) => {
      const last = lastTRef.current ?? t
      const dt = Math.min((t - last) / 1000, 1 / 30)
      lastTRef.current = t

      // While a pointer is down the drag handler owns `pos`.
      if (draggingRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const cur = pos.get()
      const diff = targetRef.current - cur
      const dur = Math.max(0.08, moveDurRef.current)
      const step = (1 / dur) * dt
      const arriving = reducedRef.current || Math.abs(diff) <= step

      if (arriving) {
        pos.set(targetRef.current)
        if (autoplayRef.current && !pausedRef.current) {
          dwellAccRef.current += dt
          if (dwellAccRef.current >= Math.max(0, dwellRef.current)) {
            dwellAccRef.current = 0
            targetRef.current += 1
          }
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        rafRef.current = null
        lastTRef.current = null
        return
      }

      pos.set(cur + Math.sign(diff) * step)
      rafRef.current = requestAnimationFrame(tick)
    },
    [pos]
  )

  const ensureRunning = useCallback(() => {
    if (rafRef.current == null) {
      lastTRef.current = null
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  const goNext = useCallback(() => {
    dwellAccRef.current = 0
    targetRef.current += 1
    ensureRunning()
  }, [ensureRunning])

  const goPrev = useCallback(() => {
    dwellAccRef.current = 0
    targetRef.current -= 1
    ensureRunning()
  }, [ensureRunning])

  const goTo = useCallback(
    (index) => {
      dwellAccRef.current = 0
      const cur = targetRef.current
      let delta = index - cur
      delta = ((delta % count) + count) % count
      if (delta > count / 2) delta -= count
      targetRef.current = cur + delta
      ensureRunning()
    },
    [count, ensureRunning]
  )

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => {
    const on = autoplay && !reducedMotion && count > 1
    autoplayRef.current = on
    if (on) {
      dwellAccRef.current = 0
      ensureRunning()
    }
    return () => {
      autoplayRef.current = false
    }
  }, [autoplay, reducedMotion, count, ensureRunning])

  useEffect(() => {
    const unsubscribe = pos.on('change', (p) => {
      // Autoplay walks `pos` past the ends forever — wrap it back to an index.
      const next = ((Math.round(p) % count) + count) % count
      setActiveIdx((prev) => (prev === next ? prev : next))
    })
    return unsubscribe
  }, [pos, count])

  /* ------------------------------ drag ------------------------------ */

  const onPointerDown = (e) => {
    if (count < 2) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragStateRef.current = { x: e.clientX, startPos: pos.get(), moved: false }
    dwellAccRef.current = 0
    ensureRunning()
  }

  const onPointerMove = (e) => {
    const state = dragStateRef.current
    if (!state) return
    const dx = e.clientX - state.x
    if (!state.moved) {
      if (Math.abs(dx) < 8) return
      state.moved = true
      draggingRef.current = true
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* capture is a nicety, not a requirement */
      }
    }
    const stepPx = Math.max(120, sizing.activeWidth * 0.55)
    pos.set(state.startPos - dx / stepPx)
    targetRef.current = pos.get()
  }

  const endDrag = (e) => {
    const state = dragStateRef.current
    dragStateRef.current = null
    if (!state) return
    if (state.moved) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      draggingRef.current = false
      lastDragEndRef.current = Date.now()
      targetRef.current = Math.round(pos.get())
      dwellAccRef.current = 0
      ensureRunning()
    }
  }

  const handleSelect = (index) => {
    if (Date.now() - lastDragEndRef.current < 300) return
    goTo(index)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goNext()
    }
  }

  const arrowSize = sizing.compact ? 40 : 48
  // Overlay arrows only when the stage has room beside the trio; otherwise
  // (tablets, laptops, phones) they would land on a neighbour card.
  const overlayArrows = !sizing.narrow && sizing.edgeRoom >= arrowSize + 16

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Feature highlights"
      className={className}
      onKeyDown={onKeyDown}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        style={{
          height: sizing.activeHeight + 64,
          touchAction: 'pan-y',
        }}
        className="relative w-full select-none overflow-hidden outline-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onMouseEnter={() => {
          pausedRef.current = true
        }}
        onMouseLeave={() => {
          pausedRef.current = false
          dwellAccRef.current = 0
        }}
      >
        {items.map((item, i) => (
          <Card
            key={item.title}
            item={item}
            index={i}
            pos={pos}
            count={count}
            R={R}
            sizing={sizing}
            activeIdx={activeIdx}
            onSelect={() => handleSelect(i)}
          />
        ))}

        {/* On narrow stages the arrows would sit on top of a cropped neighbour
            card, so they move into the control row below the stage. */}
        {count > 1 && overlayArrows && (
          <>
            <ArrowButton
              side="left"
              size={arrowSize}
              label="Previous feature"
              onClick={goPrev}
            />
            <ArrowButton
              side="right"
              size={arrowSize}
              label="Next feature"
              onClick={goNext}
            />
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {!overlayArrows && (
            <ArrowButton
              side="left"
              size={arrowSize}
              label="Previous feature"
              inline
              onClick={goPrev}
            />
          )}
          <div className="flex items-center justify-center gap-2">
            {items.map((item, i) => (
              <button
                key={item.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${item.title}`}
                aria-current={i === activeIdx ? 'true' : undefined}
                className="group/dot px-1 py-2"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIdx
                      ? 'w-7 bg-primary'
                      : 'w-1.5 bg-border group-hover/dot:bg-mute/50'
                  }`}
                />
              </button>
            ))}
          </div>
          {!overlayArrows && (
            <ArrowButton
              side="right"
              size={arrowSize}
              label="Next feature"
              inline
              onClick={goNext}
            />
          )}
        </div>
      )}
    </div>
  )
}
