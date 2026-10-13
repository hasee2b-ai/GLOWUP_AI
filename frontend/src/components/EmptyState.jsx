import { ImageIcon } from 'lucide-react'

export default function EmptyState({
  title = 'No image yet',
  hint = 'Describe your idea and hit Generate to create your first visual.',
}) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/60 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 ring-1 ring-border">
        <ImageIcon size={28} className="text-primary" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-mist">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-mute">{hint}</p>
    </div>
  )
}
