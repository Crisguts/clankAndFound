import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Footer() {
  return (
    <footer className="w-full relative bg-card border-t border-border mt-28">
      {/* Decorative elements */}
      <div className="absolute top-8 right-6 text-accent text-2xl">+</div>
      <div className="absolute top-1/2 right-12 text-accent text-lg transform -translate-y-1/2">✦</div>
      <div className="absolute bottom-24 right-20 text-accent text-xl">+</div>

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between py-16 gap-12">
          {/* Left content */}
          <div className="flex-1 max-w-xl">
            <h2
              className="text-foreground text-4xl md:text-5xl mb-10 leading-tight font-semibold text-left"
              style={{ fontFamily: "var(--font-geist-sans)" }}
            >
              Everything is Connected.
            </h2>

            <div className="space-y-6 text-foreground">
              <div className="flex items-start gap-3">
                <span className="text-accent text-xl leading-none mt-0.5">•</span>
                <p className="text-sm font-sans leading-relaxed text-left">
                  Bean believes every lost item has a home — and he's here to help reunite them.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-accent text-xl leading-none mt-0.5">•</span>
                <p className="text-sm font-sans leading-relaxed text-left">
                  His mission is to help you find what's been lost with patience and care.
                </p>
              </div>
            </div>
          </div>

          {/* Right content / UFO Image */}
          <div className="hidden md:flex flex-1 justify-end items-center">
            <div className="relative">
              <Image
                src="/jack-footer-ufo-new.png"
                alt="Bean in UFO"
                width={400}
                height={300}
                className="object-contain themed-image"
              />
            </div>
          </div>
        </div>

        {/* Mobile UFO Image */}
        <div className="md:hidden flex justify-center pb-12">
          <Image
            src="/jack-footer-ufo-new.png"
            alt="Bean in UFO"
            width={300}
            height={225}
            className="object-contain themed-image"
          />
        </div>

        {/* Branding & Action Bar */}
        <div className="py-12 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row md:items-baseline gap-2 text-left">
            <h2 className="text-foreground font-sans text-2xl font-bold whitespace-nowrap">Meet Bean!</h2>
            <p className="text-foreground/70 font-sans text-lg">Your Friendly Helper for Finding Lost Items</p>
          </div>

          <Link href="/search">
            <Button className="bg-primary text-primary-foreground px-16 py-6 rounded-full font-semibold text-xl hover:scale-105 hover:shadow-[0_0_20px_var(--primary)] transition-all duration-300">
              Explore with Bean
              <svg className="ml-2 w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17l10-10M17 17V7H7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </Link>
        </div>

        {/* Copyright Bar */}
        <div className="py-8 border-t border-border flex justify-start">
          <p className="text-muted-foreground text-sm font-sans italic opacity-80 text-left">
            © 2026 Meet Bean. All rights reserved. Built with patience and care.
          </p>
        </div>
      </div>
    </footer>
  )
}
