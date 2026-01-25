"use client"

import { useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import type { AppMode } from "@/components/search/mode-toggle"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  mode?: AppMode
}

export function SearchInput({ value, onChange, disabled, mode = "find" }: SearchInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [value])

  const label = mode === "find" 
    ? "Describe what you're looking for" 
    : "Describe what you've found"
  
  const placeholder = mode === "find"
    ? "e.g., A blue backpack with white stripes..."
    : "e.g., Found a set of keys near the park..."

  const suggestions = mode === "find"
    ? [
        { label: "Lost keys", value: "Lost keys" },
        { label: "Missing wallet", value: "Missing wallet" },
        { label: "Lost phone", value: "Lost phone" },
      ]
    : [
        { label: "Found keys", value: "Found a set of keys" },
        { label: "Found wallet", value: "Found a wallet" },
        { label: "Found bag", value: "Found a bag" },
      ]

  return (
    <div className="relative">
      <label className="block text-accent text-sm font-sans mb-2">
        {label}
      </label>
      {/* Layered input container */}
      <div className="bg-surface-1 rounded-2xl p-1">
        <div className="relative bg-surface-2 rounded-xl">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full bg-transparent border border-border-raised rounded-xl py-4 pl-12 pr-12 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 resize-none overflow-hidden min-h-[56px]"
          />
          {value && !disabled && (
            <button
              onClick={() => onChange("")}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Suggestions - also layered */}
      {!value && !disabled && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <SuggestionChip 
              key={suggestion.label}
              label={suggestion.label} 
              onClick={() => onChange(suggestion.value)} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SuggestionChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground rounded-full text-xs font-sans transition-all border border-border hover:border-primary/50"
    >
      {label}
    </button>
  )
}
