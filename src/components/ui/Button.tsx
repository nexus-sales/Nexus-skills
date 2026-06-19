import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'focus'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-[0.98]',
          {
            primary: 'bg-gradient-to-r from-[#00e5a0] to-[#0099ff] text-black hover:opacity-90',
            secondary: 'bg-[#1a2236] text-[#e8edf5] border border-[#1e2d45] hover:border-[#243451]',
            ghost: 'bg-transparent border border-[#1e2d45] text-[#8ba3c0] hover:border-[#0099ff] hover:text-[#0099ff]',
            danger: 'bg-[#ef4444] text-white hover:bg-[#dc2626]',
            focus: 'bg-[rgba(124,107,255,0.1)] text-[#7c6bff] border border-[rgba(124,107,255,0.3)] hover:bg-[rgba(124,107,255,0.2)]',
          }[variant],
          { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'w-full px-4 py-3.5 text-sm' }[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
