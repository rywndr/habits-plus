import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'
import type { ComponentProps } from 'react'

type SearchInputProps = Omit<
  ComponentProps<typeof Input>,
  'defaultValue' | 'onChange' | 'type' | 'value'
> & {
  value: string
  onValueChange: (value: string) => void
  debounceMs?: number
  containerClassName?: string
}

export function SearchInput({
  value,
  onValueChange,
  debounceMs = 300,
  containerClassName,
  className,
  'aria-label': ariaLabel = 'Cari',
  ...props
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const onValueChangeRef = useRef(onValueChange)

  useEffect(() => {
    onValueChangeRef.current = onValueChange
  }, [onValueChange])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    if (inputValue === value) return

    const timeoutId = window.setTimeout(() => {
      onValueChangeRef.current(inputValue)
    }, debounceMs)

    return () => window.clearTimeout(timeoutId)
  }, [debounceMs, inputValue, value])

  return (
    <div
      className={cn('relative w-full min-w-0 sm:max-w-sm', containerClassName)}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        {...props}
        type="search"
        value={inputValue}
        aria-label={ariaLabel}
        onChange={(event) => setInputValue(event.target.value)}
        className={cn(
          'h-11 rounded-full bg-card pr-4 pl-10 text-base sm:text-sm',
          className,
        )}
      />
    </div>
  )
}
