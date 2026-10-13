export default function Logo({ height = 32 }) {
  return (
    <img
      src="/logo-full.png"
      alt="GlowUp AI"
      height={height}
      className="shrink-0 object-contain"
      style={{ width: 'auto', maxHeight: `${height}px` }}
    />
  )
}
