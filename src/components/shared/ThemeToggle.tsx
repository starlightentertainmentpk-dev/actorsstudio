"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9 h-9" />
  }

  const isDark = theme === "dark" || resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="w-9 h-9 hover:bg-brand-100 dark:hover:bg-brand-950 transition-colors"
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-gold-500 transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-brand-600 transition-all" />
      )}
    </Button>
  )
}
