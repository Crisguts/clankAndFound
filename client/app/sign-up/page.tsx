"use client"

import React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { isDemoMode } from "@/lib/demo-mode"

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
  const isDemo = isDemoMode()

  // In demo mode, redirect to search immediately
  useEffect(() => {
    if (isDemo) {
      window.location.href = "/search"
    }
  }, [isDemo])

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
      let message = error.message || "An error occurred during sign up"
      if (message.includes("rate limit") || message.includes("Too many requests")) {
        message = "Too many attempts. Please try again in a few minutes."
      }
      setError(message)
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

                {isSuccess ? (
                  <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-geist-sans)" }}>Check your email</h3>
                    <p className="text-muted-foreground text-sm font-sans mb-6">
                      We've sent a verification link to <span className="text-foreground font-medium">{email}</span>.
                      <br />Please check your inbox to activate your account.
                    </p>
                    <Button
                      asChild
                      className="w-full bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all hover:scale-105 hover:shadow-[0_0_20px_var(--primary)]"
                    >
                      <Link href="/sign-in">Return to Sign In</Link>
                    </Button>
                  </div>
                ) : (
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

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary)] disabled:opacity-50"
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                )}

                {!isSuccess && (
                  <div className="mt-6 text-center">
                    <span className="text-muted-foreground text-sm font-sans">
                      Already have an account?{" "}
                    </span>
                    <Link href="/sign-in" className="text-primary text-sm font-sans hover:underline">
                      Sign in
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
