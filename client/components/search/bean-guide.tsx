"use client"

import { useMemo } from "react"
import Image from "next/image"
import type { SearchState } from "@/app/search/page"
import type { AppMode } from "@/components/search/mode-toggle"

interface BeanGuideProps {
  state: SearchState
  isSearching: boolean
  mode: AppMode
}

const beanMessages: Record<AppMode, Record<SearchState, { message: string; subMessage: string }>> = {
  find: {
    idle: {
      message: "Hey there! I'm Bean.",
      subMessage: "Lost something? Describe it to me or show me a picture — I'll help track it down!",
    },
    "text-only": {
      message: "Got it!",
      subMessage: "That's a helpful description. Have a photo of your lost item? It could help me find it faster!",
    },
    "image-only": {
      message: "I see it!",
      subMessage: "Thanks for the photo. Can you describe where you last saw it or any details that might help?",
    },
    both: {
      message: "Perfect!",
      subMessage: "With your description and photo, I have the best chance of reuniting you with your item.",
    },
    searching: {
      message: "Searching everywhere...",
      subMessage: "I'm checking all the lost and found reports. Hang tight, this won't take long!",
    },
    results: {
      message: "Look what I found!",
      subMessage: "These items match your search. Click on any to see more details or claim it.",
    },
    submitted: {
      message: "All set!",
      subMessage: "I've processed your search. Let me know if you need anything else!",
    },
  },
  report: {
    idle: {
      message: "Found something?",
      subMessage: "Great! Describe the item you found or upload a photo so the owner can find it.",
    },
    "text-only": {
      message: "Nice description!",
      subMessage: "Adding a photo will help the owner recognize their item even faster.",
    },
    "image-only": {
      message: "Great photo!",
      subMessage: "Can you add some details like where and when you found it?",
    },
    both: {
      message: "Awesome!",
      subMessage: "This is everything I need to help the owner find their lost item.",
    },
    searching: {
      message: "Uploading...",
      subMessage: "I'm adding your found item to the database. Almost there!",
    },
    results: {
      message: "Item reported!",
      subMessage: "Thanks for being a good human! The owner will be notified if there's a match.",
    },
    submitted: {
      message: "Got it!",
      subMessage: "I've logged your lost item report. I'll be on the lookout 24/7!",
    },
  },
}

export function BeanGuide({ state, isSearching, mode }: BeanGuideProps) {
  const { message, subMessage } = beanMessages[mode][state]

  const beanImageSrc = useMemo(() => {
    switch (state) {
      case "searching":
        return "/jack-side.png"
      case "results":
        return "/jack-front.png"
      default:
        return "/jack-front.png"
    }
  }, [state])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Bean Character */}
      <div className={`relative transition-all duration-500 ${isSearching ? "animate-bounce" : ""}`}>
        <Image
          src={beanImageSrc || "/placeholder.svg"}
          alt="Bean the friendly guide"
          width={120}
          height={120}
          className="object-contain themed-image"
        />
        {/* Glow effect when searching */}
        {isSearching && (
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        )}
      </div>

      {/* Speech Bubble - Layered */}
      <div className="relative">
        {/* Outer glow/shadow layer */}
        <div className="absolute -inset-1 bg-surface-1 rounded-[1.25rem] blur-sm" />
        {/* Middle layer */}
        <div className="relative bg-surface-1 rounded-2xl p-1">
          {/* Inner content layer */}
          <div className="relative bg-surface-2 border border-border-raised rounded-xl px-6 py-4 max-w-md">
            {/* Speech bubble tail */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-surface-2 border-l border-t border-border-raised rotate-45" />
            <h2
              className="text-foreground text-xl md:text-2xl font-semibold mb-2 text-center"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              {message}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base font-sans text-center">
              {subMessage}
            </p>
          </div>
        </div>
      </div>

      {/* State Indicator Pills */}
      <div className="flex gap-2 mt-2">
        <StateIndicatorPill label="Text" active={state === "text-only" || state === "both"} />
        <StateIndicatorPill label="Image" active={state === "image-only" || state === "both"} />
      </div>
    </div>
  )
}

function StateIndicatorPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-sans transition-all duration-300 ${active
        ? "bg-surface-3 text-primary border border-primary/50 shadow-[0_0_10px_rgba(29,237,131,0.2)]"
        : "bg-surface-1 text-muted-foreground border border-border"
        }`}
    >
      {label}
    </span>
  )
}
