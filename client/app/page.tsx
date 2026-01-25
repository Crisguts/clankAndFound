import SplineScene from "@/components/spline-scene"
import Header from "@/components/header"
import RotatingTextAccent from "@/components/rotating-text-accent"
import Footer from "@/components/footer"
import HeroTextOverlay from "@/components/hero-text-overlay"
import Link from "next/link"
import { Search, MessageSquare, ImagePlusIcon as ImageLucideIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="w-full min-h-screen py-0 bg-background">
      <div className="max-w-[1200px] mx-auto">
        {/* Hero Section */}
        <main className="w-full relative h-[600px]">
          <Header />
          <SplineScene className="absolute inset-0" />
          <HeroTextOverlay />
          <RotatingTextAccent />
        </main>

        {/* Search Feature CTA Section - Now directly below hero */}
        <section className="mx-4 md:mx-0 mt-8">
          {/* Outer layer - Surface 1 */}
          <div className="bg-surface-1 rounded-[2rem] p-2">
            {/* Middle layer - Surface 2 */}
            <div className="bg-surface-2 rounded-[1.5rem] p-1.5 border border-border">
              {/* Inner layer - Surface 3 */}
              <div className="relative rounded-[1.25rem] bg-surface-3 border border-border-raised p-8 md:p-12 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                  {/* Left content */}
                  <div className="flex-1 text-center md:text-left">
                    <h2
                      className="text-foreground text-3xl md:text-4xl font-semibold mb-4"
                      style={{ fontFamily: "var(--font-geist-sans)" }}
                    >
                      Search with Bean
                    </h2>

                    <p className="text-muted-foreground font-sans text-sm md:text-base mb-6 max-w-lg">
                      Lost something? Bean is here to help you find it. Describe your missing item,
                      upload a photo, or do both — and let Bean track it down for you.
                    </p>

                    {/* Feature highlights - with layered icons */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="bg-surface-1 p-0.5 rounded-xl">
                          <div className="p-2 bg-surface-2 rounded-lg border border-border">
                            <MessageSquare className="h-5 w-5 text-accent" />
                          </div>
                        </div>
                        <span className="text-foreground text-sm font-sans">Text Search</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-surface-1 p-0.5 rounded-xl">
                          <div className="p-2 bg-surface-2 rounded-lg border border-border">
                            <ImageLucideIcon className="h-5 w-5 text-accent" />
                          </div>
                        </div>
                        <span className="text-foreground text-sm font-sans">Image Search</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-surface-1 p-0.5 rounded-xl">
                          <div className="p-2 bg-surface-2 rounded-lg border border-border">
                            <Sparkles className="h-5 w-5 text-accent" />
                          </div>
                        </div>
                        <span className="text-foreground text-sm font-sans">Combined</span>
                      </div>
                    </div>

                    <Link href="/search">
                      <button className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg whitespace-nowrap hover:scale-105 hover:shadow-[0_0_20px_var(--primary)] transition-all duration-300 font-sans flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Start Searching
                      </Link>
                    </Button>
                  </div>

                  {/* Right illustration */}
                  <div className="flex-shrink-0 hidden md:block">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                      <img
                        src="/jack-side.png"
                        alt="Bean ready to help"
                        className="relative w-48 h-48 object-contain themed-image"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bean Information Section - Now below Search CTA */}
        <div className="mx-4 md:mx-0 mt-8 bg-surface-1 rounded-[2.5rem] p-2">
          {/* Middle layer - Surface 2 */}
          <div className="bg-surface-2 rounded-[2rem] p-1.5 border border-border">
            {/* Inner layer - Surface 3 with grid */}
            <section
              className="relative rounded-[1.5rem] py-7 w-full bg-surface-3 border border-solid border-border-raised pb-20"
              style={{
                backgroundImage: `
                  linear-gradient(var(--border) 1px, transparent 1px),
                  linear-gradient(90deg, var(--border) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            >

              <div className="px-6 md:px-40">
                <div className="flex items-center justify-center mb-3.5 md:gap-11">
                  {/* Front view */}
                  <div className="flex flex-col items-center">
                    <img src="/jack-front.png" alt="Bean front view" className="w-48 h-48 md:w-56 md:h-56 object-contain themed-image" />
                  </div>

                  {/* Side view */}
                  <div className="flex flex-col items-center">
                    <img src="/jack-side.png" alt="Bean side view" className="w-48 h-48 md:w-56 md:h-56 object-contain themed-image" />
                  </div>

                  {/* Back view */}
                  <div className="flex flex-col items-center">
                    <img src="/jack-back.png" alt="Bean back view" className="w-48 h-48 md:w-56 md:h-56 object-contain themed-image" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-w-5xl">
                  <div className="flex items-center gap-4">
                    <span className="text-accent font-sans text-sm">Name</span>
                    <span className="text-foreground font-sans text-sm">Bean</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-accent font-sans text-sm">Species</span>
                    <span className="text-foreground font-sans text-sm">Alien from Planet Jellybean</span>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-accent font-sans text-sm">Personality</span>
                    <span className="text-foreground font-sans text-sm">
                      Curious, flexible, a bit laid-back — but sharp when it comes to tracking down lost items and reuniting them with their owners.
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
