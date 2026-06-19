import { SelectHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const UISelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, className, ...props }, ref) => {
    const id = useId()
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-[11px] text-[#8ba3c0] uppercase tracking-[0.04em]">
          {label}
        </label>
        <select
          ref={ref}
          id={id}
          aria-label={label}
          className={cn(
            'bg-[#1a2236] border border-[#1e2d45] rounded-lg text-[#e8edf5] text-[13px] px-3 py-2 outline-none',
            'focus:border-[#0099ff] focus:ring-2 focus:ring-[rgba(0,153,255,0.1)]',
            'appearance-none bg-no-repeat bg-[right_12px_center]',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  }
)
UISelect.displayName = 'UISelect'
