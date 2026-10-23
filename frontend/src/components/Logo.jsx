import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const MAX_OFFSET = 5 // px — subtle magnetic travel for the logo
const EASE = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
const BALL_LERP = 0.2 // lower = more elegant trailing delay
const HIT_PAD = 14 // px — slightly enlarge the logo hit area

/**
 * GlowUp AI logo with a Shery.js-style magnetic + floating-ball effect.
 *
 * A single rAF loop is the single source of truth: every frame it reads the
 * latest pointer position and the logo's live bounding rect, then (a) lerps
 * the ball toward the pointer, (b) toggles ball visibility from the hit test,
 * and (c) applies the magnetic pull to the logo. Because nothing is cached in
 * a "isOver" flag, the ball can never get stuck visible, and scroll / magnetic
 * movement are always accounted for via a fresh getBoundingClientRect().
 */
export default function Logo({ height = 32 }) {
  const wrapRef = useRef(null)
  const ballRef = useRef(null)
  const frameRef = useRef(0)
  const mousePos = useRef({ x: 0, y: 0 })
  const ballPos = useRef({ x: 0, y: 0 })
  const pointerInside = useRef(false)

  useEffect(() => {
    const el = wrapRef.current
    const ball = ballRef.current
    if (!el || !ball) return

    // Respect reduced-motion and skip entirely on touch-only devices.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      mousePos.current = { x: e.clientX, y: e.clientY }
      pointerInside.current = true
    }

    // relatedTarget is null only when the pointer leaves the window.
    const onOut = (e) => {
      if (!e.relatedTarget) pointerInside.current = false
    }

    const tick = () => {
      // Fresh rect every frame → correct even while scrolling or mid-magnet.
      const rect = el.getBoundingClientRect()
      const { x: mx, y: my } = mousePos.current

      const over =
        pointerInside.current &&
        mx >= rect.left - HIT_PAD &&
        mx <= rect.right + HIT_PAD &&
        my >= rect.top - HIT_PAD &&
        my <= rect.bottom + HIT_PAD

      // Ball always tracks the cursor (lerped) so it's already in place
      // when it fades in — no fly-in from a stale position.
      ballPos.current.x += (mx - ballPos.current.x) * BALL_LERP
      ballPos.current.y += (my - ballPos.current.y) * BALL_LERP
      ball.style.transform = `translate(${ballPos.current.x}px, ${ballPos.current.y}px) translate(-50%, -50%)`
      ball.style.opacity = over ? '1' : '0'

      // Magnetic pull toward the pointer (clamped), reset on exit.
      if (over) {
        const dx = mx - (rect.left + rect.width / 2)
        const dy = my - (rect.top + rect.height / 2)
        const x = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx * 0.12))
        const y = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dy * 0.12))
        el.style.transform = `translate(${x}px, ${y}px)`
      } else {
        el.style.transform = 'translate(0px, 0px)'
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    // Seed the ball at the logo center so the first hover is instant.
    const rect = el.getBoundingClientRect()
    ballPos.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut)
    document.documentElement.addEventListener('pointerleave', onOut)
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
      document.documentElement.removeEventListener('pointerleave', onOut)
    }
  }, [])

  return (
    <>
      <div
        ref={wrapRef}
        className="inline-flex will-change-transform"
        style={{ transition: EASE }}
        aria-hidden="true"
      >
        <img
          src="/logo-full.webp"
          alt="GlowUp AI"
          height={height}
          className="shrink-0 object-contain"
          style={{ width: 'auto', maxHeight: `${height}px`, pointerEvents: 'none' }}
          draggable="false"
        />
      </div>

      {/* Floating ball — portalled to body so backdrop-blur on the navbar
          doesn't trap it. pointer-events:none so it never blocks clicks. */}
      {createPortal(
        <div
          ref={ballRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[9999] h-5 w-5 rounded-full opacity-0"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #F4A7C5 0%, #8B5CF6 100%)',
            boxShadow: '0 0 14px 3px rgba(139, 92, 246, 0.45)',
            transition: 'opacity 0.35s ease',
            willChange: 'transform, opacity',
          }}
        />,
        document.body
      )}
    </>
  )
}
