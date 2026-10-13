import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-triggered reveal wrapper. Fades/slides children in the first time they
 * enter the viewport. Respects prefers-reduced-motion (transitions become
 * near-instant via the global CSS override).
 */
const VARIANTS = {
  up: 'translate-y-10',
  down: '-translate-y-10',
  left: 'translate-x-10',
  right: '-translate-x-10',
  scale: 'scale-[0.96]',
  none: '',
}

export default function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hidden = VARIANTS[variant] || VARIANTS.up

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : `opacity-0 ${hidden}`
      } ${className}`}
    >
      {children}
    </Tag>
  )
}
