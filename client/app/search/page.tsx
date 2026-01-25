"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { SearchInput } from "@/components/search/search-input"
import { ImageUpload } from "@/components/search/image-upload"
import { BeanGuide } from "@/components/search/bean-guide"
import { SearchResults } from "@/components/search/search-results"
import { ModeToggle, type AppMode } from "@/components/search/mode-toggle"
import { Button } from "@/components/ui/button"
import { Search, Upload, Sparkles, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

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
  const [mode, setMode] = useState<AppMode>("find")
  const [searchState, setSearchState] = useState<SearchState>("idle")
  const [textQuery, setTextQuery] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [results, setResults] = useState<SearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

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

    // Auth check for Report Lost
    if (mode === "report" && !user) {
      alert("Please sign in to report a lost item.")
      window.location.href = "/sign-in"
      return
    }

    setIsSearching(true)
    setSearchState("searching")

    // Simulate search/upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (mode === "report") {
      setSearchState("submitted")
    } else {
      setResults(mockResults)
      setSearchState("results")
    }
    setIsSearching(false)
  }, [textQuery, uploadedImage, mode, user])

  const handleReset = useCallback(() => {
    setTextQuery("")
    setUploadedImage(null)
    setResults([])
    setSearchState("idle")
  }, [])

  const canSearch = textQuery || uploadedImage

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <Header />

      <main className="max-w-[1200px] mx-auto pt-24 px-4 md:px-6 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground font-sans">Checking authentication...</p>
          </div>
        ) : !user ? (
          <div className="max-w-xl mx-auto mt-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-surface-1 rounded-[2.5rem] p-2 mb-8 shadow-2xl">
              <div className="bg-surface-2 rounded-[2rem] p-1.5 border border-border">
                <div className="bg-surface-3 rounded-[1.75rem] border border-border-raised p-12 flex flex-col items-center">
                  <div className="bg-primary/10 p-6 rounded-full mb-8">
                    <Search className="h-16 w-16 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-geist-sans)" }}>
                    Login Required
                  </h1>
                  <p className="text-muted-foreground text-lg mb-8">
                    You need to be signed in to access Bean's search and reporting tools.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Button
                      asChild
                      className="flex-1 bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all hover:scale-105"
                    >
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 rounded-full py-6 font-semibold border-border-raised hover:bg-surface-2"
                    >
                      <Link href="/">Back to Home</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : searchState === "submitted" ? (
          <div className="max-w-xl mx-auto mt-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-surface-1 rounded-[2.5rem] p-2 mb-8 shadow-2xl">
              <div className="bg-surface-2 rounded-[2rem] p-1.5 border border-border">
                <div className="bg-surface-3 rounded-[1.75rem] border border-border-raised p-12 flex flex-col items-center">
                  <div className="bg-primary/10 p-6 rounded-full mb-8">
                    <CheckCircle2 className="h-16 w-16 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-geist-sans)" }}>
                    Thank You!
                  </h1>
                  <p className="text-muted-foreground text-lg mb-8">
                    Your lost item has been reported successfully. Bean is already on the case and will notify you as soon as a match is found.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <Button
                      asChild
                      className="flex-1 bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all hover:scale-105"
                    >
                      <Link href="/">Back to Home</Link>
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="flex-1 rounded-full py-6 font-semibold border-border-raised hover:bg-surface-2"
                    >
                      Report Another Item
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Toggle */}
            <ModeToggle mode={mode} onModeChange={handleModeChange} />

            {/* Hero Section with Bean */}
            <div className="flex flex-col items-center text-center mb-12">
              <BeanGuide state={searchState} isSearching={isSearching} mode={mode} />
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
                    className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
