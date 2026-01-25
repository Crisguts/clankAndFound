"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

import { ThemeToggle } from "@/components/theme-toggle"
import { PaletteToggle } from "@/components/palette-toggle"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSuccess(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        setIsSuccess(true)
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during sign up")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-sans text-sm">Back to Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <PaletteToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Layered container */}
          <div className="bg-surface-1 rounded-[2rem] p-2">
            <div className="bg-surface-2 rounded-[1.5rem] p-1.5 border border-border">
              <div className="bg-surface-3 rounded-[1.25rem] border border-border-raised p-8">
                {/* Logo/Character */}
                <div className="flex justify-center mb-6">
                  <img
                    src="/jack-front.png"
                    alt="Bean"
                    className="w-20 h-20 object-contain themed-image"
                  />
                </div>

                <h1
                  className="text-foreground text-2xl font-semibold text-center mb-2"
                  style={{ fontFamily: "var(--font-geist-sans)" }}
                >
                  Create Account
                </h1>
                <p className="text-muted-foreground text-sm font-sans text-center mb-8">
                  Join Bean in the mission to reunite lost items
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-accent text-sm font-sans mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-surface-2 border border-border-raised rounded-xl py-3 px-4 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-accent text-sm font-sans mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-surface-2 border border-border-raised rounded-xl py-3 px-4 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-accent text-sm font-sans mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="w-full bg-surface-2 border border-border-raised rounded-xl py-3 px-4 pr-12 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-accent text-sm font-sans mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full bg-surface-2 border border-border-raised rounded-xl py-3 px-4 pr-12 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs py-3 px-4 rounded-lg font-sans text-center">
                      {error}
                    </div>
                  )}

                  {isSuccess && (
                    <div className="bg-primary/10 border border-primary/20 text-primary text-xs py-3 px-4 rounded-lg font-sans text-center">
                      Sign up successful! Please check your email for verification.
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(29,237,131,0.5)] disabled:opacity-50"
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <span className="text-muted-foreground text-sm font-sans">
                    Already have an account?{" "}
                  </span>
                  <Link href="/sign-in" className="text-primary text-sm font-sans hover:underline">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
