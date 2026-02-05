"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, User, LogOut, Sparkles, Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { PaletteToggle } from "@/components/palette-toggle"
import { supabase } from "@/lib/supabase"
import { isDemoMode, DEMO_USER } from "@/lib/demo-mode"

export default function Header() {
  const [user, setUser] = useState<any>(null)
  const isDemo = isDemoMode()

  useEffect(() => {
    // In demo mode, automatically set a demo user
    if (isDemo) {
      setUser(DEMO_USER)
      return
    }

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [isDemo])

  const handleSignOut = async () => {
    if (isDemo) {
      // In demo mode, just redirect to home
      window.location.href = "/"
      return
    }
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/0 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-foreground font-sans font-bold text-xl hover:text-primary transition-colors">
          ClankAndFound: Meet Bean
        </Link>

        <div className="flex items-center gap-3">
          <PaletteToggle />
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              {isDemo && (
                <>
                  <Link 
                    href="/admin" 
                    className="hidden sm:inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-600 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-purple-500/30 transition-colors"
                  >
                    <Shield className="h-3 w-3" />
                    Test Admin Page
                  </Link>
                  <span className="hidden sm:inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-600 px-3 py-1 rounded-full text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    Demo Mode
                  </span>
                </>
              )}
              <Link href="/profile" className="hidden sm:flex items-center gap-2 bg-surface-2 border border-border rounded-full px-4 py-1.5 hover:border-primary transition-all">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-sans truncate max-w-[100px]">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
              </Link>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="rounded-full px-4 border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300 bg-transparent flex items-center gap-2"
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
                className="rounded-full w-28 h-11 border-border hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-300 bg-transparent hidden sm:flex justify-center"
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-primary text-primary-foreground rounded-full w-28 h-11 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary)] justify-center"
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
