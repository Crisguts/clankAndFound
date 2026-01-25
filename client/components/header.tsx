"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, User, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PaletteToggle } from "@/components/palette-toggle"
import { supabase } from "@/lib/supabase"

export default function Header() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/0 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-foreground font-sans font-bold text-xl hover:text-primary transition-colors">
          Meet Bean
        </Link>

        <div className="flex items-center gap-3">
          <PaletteToggle />
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-surface-2 border border-border rounded-full px-4 py-1.5">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-sans truncate max-w-[100px]">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="rounded-full px-4 border-border hover:border-destructive hover:text-destructive transition-all duration-300 bg-transparent flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                className="rounded-full px-5 border-border hover:border-primary hover:text-primary transition-all duration-300 bg-transparent hidden sm:flex"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-primary text-primary-foreground rounded-full px-6 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(29,237,131,0.5)]"
              >
                <Link href="/sign-up">
                  <span className="hidden sm:inline">Sign Up</span>
                  <User className="h-4 w-4 sm:hidden" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
