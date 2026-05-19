import { cn } from '#/lib/utils'

type Props = {
  className?: string
  size?: number
}

export function BrandLogo({ className, size = 96 }: Props) {
  return (
    <div
      className={cn(
        'grid place-items-center overflow-hidden rounded-full bg-white shadow-md',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src="/favicon.svg"
        alt="Habits+ logo"
        className="size-full object-contain"
        draggable={false}
      />
    </div>
  )
}
