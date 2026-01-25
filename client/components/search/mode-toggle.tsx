"use client"

export type AppMode = "find" | "report"

interface ModeToggleProps {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex justify-center mb-8">
      {/* Outer layer - Surface 1 */}
      <div className="bg-surface-1 rounded-full p-1">
        {/* Inner container */}
        <div className="relative bg-surface-2 rounded-full p-1 border border-border flex">
          {/* Sliding background indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(29,237,131,0.3)] ${mode === "report" ? "left-[calc(50%+2px)]" : "left-1"
              }`}
          />

          {/* Find Item Button */}
          <button
            onClick={() => onModeChange("find")}
            className={`relative z-10 px-6 py-2.5 rounded-full font-sans text-sm font-medium transition-colors duration-300 ${mode === "find"
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Find Item
          </button>

          {/* Report Found Button */}
          <button
            onClick={() => onModeChange("report")}
            className={`relative z-10 px-6 py-2.5 rounded-full font-sans text-sm font-medium transition-colors duration-300 ${mode === "report"
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Report Found
          </button>
        </div>
      </div>
    </div>
  )
}
