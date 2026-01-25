"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Check stored preference first, then fall back to system preference
    const stored = localStorage.getItem("theme")
    if (stored) {
      setIsDark(stored === "dark")
      document.documentElement.setAttribute("data-theme", stored)
    } else {
      // Use system preference as initial state
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDark(prefersDark)
      // Don't set data-theme, let CSS media query handle it
    }
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    const newTheme = newIsDark ? "dark" : "light"
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        size="icon"
        className="bg-primary text-primary-foreground rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(29,237,131,0.5)]"
      >
        <span className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      size="icon"
      onClick={toggleTheme}
      className="bg-primary text-primary-foreground rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(29,237,131,0.5)]"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
