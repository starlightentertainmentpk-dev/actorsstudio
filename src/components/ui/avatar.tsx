import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "default" | "lg" | "xl"
}

export function Avatar({
  src,
  alt = "User",
  fallback = "U",
  size = "default",
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    default: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base font-bold",
    xl: "h-20 w-20 text-xl font-bold",
  }

  const showImage = src && !imageError

  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted/60 text-muted-foreground select-none ring-1 ring-border/40",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover rounded-full"
        />
      ) : (
        <span className="font-semibold uppercase text-brand-600 dark:text-brand-400">
          {fallback.slice(0, 2)}
        </span>
      )}
    </div>
  )
}
