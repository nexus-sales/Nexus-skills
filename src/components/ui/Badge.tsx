import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'blue' | 'purple' | 'red' | 'muted'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border',
        {
          default:  'bg-surface2 border-border text-muted',
          accent:   'bg-accent/10 border-accent/20 text-accent',
          blue:     'bg-accent-blue/10 border-accent-blue/20 text-accent-blue',
          purple:   'bg-accent-purple/10 border-accent-purple/20 text-accent-purple',
          red:      'bg-red-500/10 border-red-500/20 text-red-400',
          muted:    'bg-surface border-border/50 text-muted/70',
        }[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
