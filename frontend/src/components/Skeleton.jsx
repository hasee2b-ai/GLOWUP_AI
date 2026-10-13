export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-surface-2 ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-mist/[0.06] to-transparent bg-[length:200%_100%]" />
    </div>
  )
}
