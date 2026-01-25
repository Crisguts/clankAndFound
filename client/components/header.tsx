import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PaletteToggle } from "@/components/palette-toggle"

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/0 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-foreground font-sans font-bold text-xl hover:text-primary transition-colors">
          ClankAndFound: Meet Bean
        </Link>

        <div className="flex items-center gap-3">
          <PaletteToggle />
          <ThemeToggle />
          <Link href="/sign-in">
            <Button
              className="bg-primary text-primary-foreground rounded-full px-6 w-28 justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary)] hidden sm:flex"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button
              className="bg-primary text-primary-foreground rounded-full px-6 w-28 justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary)]"
            >
              <span className="hidden sm:inline">Sign Up</span>
              <User className="h-4 w-4 sm:hidden" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
