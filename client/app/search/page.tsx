"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { SearchInput } from "@/components/search/search-input"
import { ImageUpload } from "@/components/search/image-upload"
import { BeanGuide } from "@/components/search/bean-guide"
import { SearchResults } from "@/components/search/search-results"
import { ModeToggle, type AppMode } from "@/components/search/mode-toggle"
import { Button } from "@/components/ui/button"
import { Search, Upload, Sparkles } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export type SearchState = "idle" | "text-only" | "image-only" | "both" | "searching" | "results" | "submitted"

export interface SearchItem {
  id: string
  name: string
  description: string
  imageUrl: string
  category: string
  matchScore: number
}

// Mock search results for demo
const mockResults: SearchItem[] = [
  {
    id: "1",
    name: "Vintage Database Schema",
    description: "A beautifully designed relational database schema from the 1990s",
    imageUrl: "/jack-front.png",
    category: "Schema",
    matchScore: 95,
  },
  {
    id: "2",
    name: "NoSQL Connection Pattern",
    description: "Modern NoSQL database connection patterns for distributed systems",
    imageUrl: "/jack-side.png",
    category: "Pattern",
    matchScore: 87,
  },
  {
    id: "3",
    name: "Data Flow Diagram",
    description: "Entity relationship diagram showing complex data flows",
    imageUrl: "/jack-back.png",
    category: "Diagram",
    matchScore: 72,
  },
]

export default function SearchPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AppMode>("find")
  const [searchState, setSearchState] = useState<SearchState>("idle")
  const [textQuery, setTextQuery] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [results, setResults] = useState<SearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode)
    // Reset state when switching modes
    setTextQuery("")
    setUploadedImage(null)
    setResults([])
    setSearchState("idle")
  }, [])

  const handleTextChange = useCallback((value: string) => {
    setTextQuery(value)
    if (value && uploadedImage) {
      setSearchState("both")
    } else if (value) {
      setSearchState("text-only")
    } else if (uploadedImage) {
      setSearchState("image-only")
    } else {
      setSearchState("idle")
    }
  }, [uploadedImage])

  const handleImageUpload = useCallback((imageUrl: string | null) => {
    setUploadedImage(imageUrl)
    if (imageUrl && textQuery) {
      setSearchState("both")
    } else if (imageUrl) {
      setSearchState("image-only")
    } else if (textQuery) {
      setSearchState("text-only")
    } else {
      setSearchState("idle")
    }
  }, [textQuery])

  const handleSearch = useCallback(async () => {
    if (!textQuery && !uploadedImage) return

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("Please sign in to report an item or search.")
      router.push(`/sign-in?redirect=/search`)
      return
    }

    setIsSearching(true)
    setSearchState("searching")

    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (mode === "report") {
      setSearchState("submitted")
    } else {
      setResults(mockResults)
      setSearchState("results")
    }
    setIsSearching(false)
  }, [textQuery, uploadedImage, mode, router])

  const handleReset = useCallback(() => {
    setTextQuery("")
    setUploadedImage(null)
    setResults([])
    setSearchState("idle")
  }, [])

  const canSearch = textQuery || uploadedImage

  return (
    <div className="w-full min-h-screen bg-background">
      <Header />

      <main className="max-w-[1200px] mx-auto pt-24 px-4 md:px-6 pb-12">
        {/* Mode Toggle */}
        <ModeToggle mode={mode} onModeChange={handleModeChange} />

        {/* Hero Section with Bean */}
        <div className="flex flex-col items-center text-center mb-12">
          <BeanGuide state={searchState} isSearching={isSearching} mode={mode} />
        </div>

        {/* Search Interface */}
        <div className="max-w-3xl mx-auto">
          {searchState === "submitted" ? (
            <div className="bg-surface-1 rounded-[2rem] p-2 shadow-2xl animate-in fade-in zoom-in duration-500">
              <div className="bg-surface-2 rounded-3xl p-1.5 border border-border">
                <div className="relative rounded-[1.25rem] p-8 md:p-12 bg-surface-3 border border-border-raised text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-foreground text-3xl font-semibold mb-4" style={{ fontFamily: "var(--font-geist-sans)" }}>
                    Thank you for your report!
                  </h2>
                  <p className="text-muted-foreground font-sans text-lg mb-8 max-w-md mx-auto">
                    Bean has received the details of the lost item. We'll notify you as soon as a match is found!
                  </p>
                  <Button
                    onClick={handleReset}
                    className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105"
                  >
                    Submit Another Report
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Outer container - Surface 1 (deepest) */}
              <div className="bg-surface-1 rounded-[2rem] p-2 shadow-2xl">
                {/* Middle container - Surface 2 */}
                <div className="bg-surface-2 rounded-3xl p-1.5 border border-border">
                  {/* Inner container - Surface 3 (raised) with grid */}
                  <div
                    className="relative rounded-[1.25rem] p-6 md:p-8 bg-surface-3 border border-border-raised"
                    style={{
                      backgroundImage: `
                        linear-gradient(var(--border) 1px, transparent 1px),
                        linear-gradient(90deg, var(--border) 1px, transparent 1px)
                      `,
                      backgroundSize: "40px 40px",
                    }}
                  >
                    {/* Text Search Input */}
                    <SearchInput
                      value={textQuery}
                      onChange={handleTextChange}
                      disabled={isSearching}
                      mode={mode}
                    />

                    {/* Divider with "or" */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-muted-foreground text-sm font-sans">or add an image</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Image Upload */}
                    <ImageUpload
                      uploadedImage={uploadedImage}
                      onImageUpload={handleImageUpload}
                      disabled={isSearching}
                    />

                    {/* Action Button */}
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={handleSearch}
                        disabled={!canSearch || isSearching}
                        className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(29,237,131,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isSearching ? (
                          <>
                            <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                            {mode === "find" ? "Bean is searching..." : "Uploading..."}
                          </>
                        ) : (
                          <>
                            {mode === "find" ? (
                              <>
                                <Search className="mr-2 h-5 w-5" />
                                Search with Bean
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-5 w-5" />
                                Report Lost Item
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {searchState === "results" && results.length > 0 && (
                <SearchResults results={results} onReset={handleReset} />
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
