"use client"

import { useState, useEffect, useRef } from "react"
import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ColorPalette = "forest" | "ocean" | "sunset" | "lavender" | "monochrome"

interface PaletteOption {
  id: ColorPalette
  name: string
  preview: {
    primary: string
    secondary: string
  }
}

const palettes: PaletteOption[] = [
  {
    id: "forest",
    name: "Forest",
    preview: { primary: "#1DED83", secondary: "#0D7A43" },
  },
  {
    id: "ocean",
    name: "Ocean",
    preview: { primary: "#3B82F6", secondary: "#1D4ED8" },
  },
  {
    id: "sunset",
    name: "Sunset",
    preview: { primary: "#F97316", secondary: "#EA580C" },
  },
  {
    id: "lavender",
    name: "Lavender",
    preview: { primary: "#A855F7", secondary: "#7C3AED" },
  },
  {
    id: "monochrome",
    name: "Monochrome",
    preview: { primary: "#737373", secondary: "#525252" },
  },
]

export function PaletteToggle() {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>("forest")
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("color-palette") as ColorPalette | null
    if (stored && palettes.some(p => p.id === stored)) {
      setCurrentPalette(stored)
      document.documentElement.setAttribute("data-palette", stored)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectPalette = (palette: ColorPalette) => {
    setCurrentPalette(palette)
    localStorage.setItem("color-palette", palette)
    document.documentElement.setAttribute("data-palette", palette)
    setIsOpen(false)
  }

  const currentPaletteData = palettes.find(p => p.id === currentPalette)

  if (!mounted) {
    return (
      <Button
        size="icon"
        className="bg-primary text-primary-foreground rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary)]"
      >
        <Palette className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-primary-foreground rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary)]"
        title="Change color palette"
      >
        <Palette className="h-4 w-4" />
        <span className="sr-only">Change color palette</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50">
          <div className="bg-surface-1 rounded-2xl p-1.5 shadow-2xl">
            <div className="bg-surface-2 rounded-xl p-2 border border-border">
              <div className="bg-surface-3 rounded-lg p-3 border border-border-raised min-w-[180px]">
                <p className="text-xs font-sans text-muted-foreground mb-3">Color Palette</p>
                <div className="flex flex-col gap-1.5">
                  {palettes.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => selectPalette(palette.id)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${currentPalette === palette.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-surface-2 border border-transparent"
                        }`}
                    >
                      <div className="flex gap-0.5">
                        <div
                          className="w-4 h-4 rounded-l-md"
                          style={{ backgroundColor: palette.preview.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-r-md"
                          style={{ backgroundColor: palette.preview.secondary }}
                        />
                      </div>
                      <span className="text-sm font-sans text-foreground">{palette.name}</span>
                      {currentPalette === palette.id && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
