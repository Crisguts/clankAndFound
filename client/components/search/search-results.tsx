"use client"

import Image from "next/image"
import type { SearchItem } from "@/app/search/page"
import { Button } from "@/components/ui/button"
import { RotateCcw, ArrowUpRight } from "lucide-react"

interface SearchResultsProps {
  results: SearchItem[]
  onReset: () => void
}

export function SearchResults({ results, onReset }: SearchResultsProps) {
  return (
    <div className="mt-12">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className="text-foreground text-2xl font-semibold"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            Search Results
          </h3>
          <p className="text-muted-foreground text-sm font-sans mt-1">
            Found {results.length} items matching your search
          </p>
        </div>
        <Button
          onClick={onReset}
          variant="outline"
          className="rounded-full border-border hover:border-primary hover:text-primary bg-transparent"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          New Search
        </Button>
      </div>

      {/* Results Grid - Layered cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((item) => (
          <ResultCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function ResultCard({ item }: { item: SearchItem }) {
  return (
    <div className="group">
      {/* Outer layer - Surface 1 */}
      <div className="bg-surface-1 rounded-[1.5rem] p-1 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(29,237,131,0.15)]">
        {/* Middle layer - Surface 2 */}
        <div className="bg-surface-2 rounded-[1.25rem] p-1 border border-border">
          {/* Inner layer - Surface 3 */}
          <div className="bg-surface-3 rounded-xl overflow-hidden border border-border-raised transition-all duration-300 group-hover:border-primary/50">
            {/* Image */}
            <div className="relative h-40 bg-surface-2 overflow-hidden">
              <Image
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.name}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
              {/* Match Score Badge */}
              <div className="absolute top-3 right-3 px-2 py-1 bg-surface-2/90 backdrop-blur-sm rounded-full border border-primary/30">
                <span className="text-primary text-xs font-sans font-semibold">
                  {item.matchScore}% match
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Category Tag */}
              <span className="inline-block px-2 py-0.5 bg-surface-2 text-muted-foreground rounded text-xs font-sans mb-2 border border-border">
                {item.category}
              </span>

              <h4 className="text-foreground font-semibold text-lg mb-1 line-clamp-1">
                {item.name}
              </h4>
              <p className="text-muted-foreground text-sm font-sans line-clamp-2 mb-4">
                {item.description}
              </p>

              {/* Action Button - Layered */}
              <div className="bg-surface-1 rounded-xl p-0.5">
                <button className="w-full flex items-center justify-center gap-2 py-2 bg-surface-2 border border-border-raised rounded-lg text-foreground text-sm font-sans transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary">
                  View Details
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
