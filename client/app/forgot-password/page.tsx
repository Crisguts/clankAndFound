"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [validationError, setValidationError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            setValidationError("Please fill out this field.")
            return
        }

        setIsLoading(true)
        setError(null)
        setValidationError(null)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) throw error

            setIsSubmitted(true)
        } catch (error: any) {
            setError(error.message || "An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="px-6 py-4">
                <Link href="/sign-in" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="font-sans text-sm">Back to Sign In</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="bg-surface-1 rounded-[2rem] p-2">
                        <div className="bg-surface-2 rounded-[1.5rem] p-1.5 border border-border">
                            <div className="bg-surface-3 rounded-[1.25rem] border border-border-raised p-8">

                                {isSubmitted ? (
                                    <div className="text-center animate-in fade-in zoom-in duration-500">
                                        <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 className="h-8 w-8 text-primary" />
                                        </div>
                                        <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-geist-sans)" }}>
                                            Check your email
                                        </h1>
                                        <p className="text-muted-foreground text-sm font-sans mb-8">
                                            We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>.
                                        </p>
                                        <Button
                                            asChild
                                            className="w-full bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all hover:scale-105"
                                        >
                                            <Link href="/sign-in">Return to Sign In</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-center mb-6">
                                            <div className="bg-surface-1 p-4 rounded-2xl border border-border mt-2">
                                                <Mail className="h-8 w-8 text-accent" />
                                            </div>
                                        </div>

                                        <h1
                                            className="text-foreground text-2xl font-semibold text-center mb-2"
                                            style={{ fontFamily: "var(--font-geist-sans)" }}
                                        >
                                            Forgot Password?
                                        </h1>
                                        <p className="text-muted-foreground text-sm font-sans text-center mb-8">
                                            No worries, Bean will help you get back in. Enter your email to receive a reset link.
                                        </p>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div>
                                                <label className="block text-accent text-sm font-sans mb-2">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value)
                                                        if (validationError) setValidationError(null)
                                                    }}
                                                    placeholder="you@example.com"
                                                    className={`w-full bg-surface-2 border rounded-xl py-3 px-4 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${validationError ? "border-destructive focus:border-destructive focus:ring-destructive/50" : "border-border-raised"
                                                        }`}
                                                />
                                                {validationError && (
                                                    <div className="absolute mt-1 bg-surface-2 text-foreground text-xs py-2 px-3 rounded-md border border-border-raised shadow-lg flex items-center gap-2 z-10 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="bg-orange-500 rounded-sm p-0.5">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                        </div>
                                                        Please fill out this field.
                                                    </div>
                                                )}
                                            </div>

                                            {error && (
                                                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs py-3 px-4 rounded-lg font-sans">
                                                    {error}
                                                </div>
                                            )}

                                            <Button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_var(--primary)] disabled:opacity-50"
                                            >
                                                {isLoading ? "Sending link..." : "Send Reset Link"}
                                            </Button>
                                        </form>

                                        <div className="mt-6 text-center">
                                            <Link href="/sign-in" className="text-primary text-sm font-sans hover:underline">
                                                Actually, I remember it
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
