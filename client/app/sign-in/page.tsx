"use client"

import React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { isDemoMode, DEMO_MESSAGE } from "@/lib/demo-mode"

import { ThemeToggle } from "@/components/theme-toggle"
import { PaletteToggle } from "@/components/palette-toggle"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({})
  const isDemo = isDemoMode()

  // In demo mode, redirect to search immediately
  useEffect(() => {
    if (isDemo) {
      window.location.href = "/search"
    }
  }, [isDemo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Custom Validation
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) errors.email = "Please fill out this field."
    if (!password) errors.password = "Please fill out this field."

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsLoading(true)
    setError(null)
    setValidationErrors({})

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Fetch user role from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()

        // Redirect based on role
        if (profile?.role === "assistant") {
          window.location.href = "/admin"
        } else {
          window.location.href = "/search"
        }
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during sign in")
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
      <main className="flex-1 flex items-center justify-center px-4">
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
                  Welcome Back
                </h1>
                <p className="text-muted-foreground text-sm font-sans text-center mb-8">
                  Sign in to continue finding lost items with Bean
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-accent text-sm font-sans mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }))
                      }}
                      placeholder="you@example.com"
                      className={`w-full bg-surface-2 border rounded-xl py-3 px-4 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${validationErrors.email ? "border-destructive focus:border-destructive focus:ring-destructive/50" : "border-border-raised"
                        }`}
                    />
                    {validationErrors.email && (
                      <div className="absolute mt-1 bg-surface-2 text-foreground text-xs py-2 px-3 rounded-md border border-border-raised shadow-lg flex items-center gap-2 z-10 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-orange-500 rounded-sm p-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        </div>
                        {validationErrors.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-accent text-sm font-sans mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: undefined }))
                        }}
                        placeholder="Enter your password"
                        className={`w-full bg-surface-2 border rounded-xl py-3 px-4 pr-12 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${validationErrors.password ? "border-destructive focus:border-destructive focus:ring-destructive/50" : "border-border-raised"
                          }`}
                      />
                      {validationErrors.password && (
                        <div className="absolute mt-1 top-full bg-surface-2 text-foreground text-xs py-2 px-3 rounded-md border border-border-raised shadow-lg flex items-center gap-2 z-10 animate-in fade-in zoom-in-95 duration-200">
                          <div className="bg-orange-500 rounded-sm p-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                          </div>
                          {validationErrors.password}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs py-3 px-4 rounded-lg font-sans">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-primary text-sm font-sans hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary)] disabled:opacity-50"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <span className="text-muted-foreground text-sm font-sans">
                    Don't have an account?{" "}
                  </span>
                  <Link href="/sign-up" className="text-primary text-sm font-sans hover:underline">
                    Sign up
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
