"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { isDemoMode } from "@/lib/demo-mode"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isCheckingSession, setIsCheckingSession] = useState(true)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const isDemo = isDemoMode()

    useEffect(() => {
        // In demo mode, redirect to search immediately
        if (isDemo) {
            window.location.href = "/search"
            return
        }

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setIsCheckingSession(false)
            } else {
                // If no session yet, wait a bit or listen for change
                // Supabase might still be processing the fragment
                const timeout = setTimeout(() => {
                    setIsCheckingSession(false)
                }, 2000)
                return () => clearTimeout(timeout)
            }
        }
        checkSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" || session) {
                setIsCheckingSession(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [isDemo])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setIsSuccess(true)
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

                                {isCheckingSession ? (
                                    <div className="flex flex-col items-center justify-center min-h-[200px]">
                                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        <p className="mt-4 text-muted-foreground font-sans text-sm">Validating recovery link...</p>
                                    </div>
                                ) : isSuccess ? (
                                    <div className="text-center animate-in fade-in zoom-in duration-500">
                                        <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 className="h-8 w-8 text-primary" />
                                        </div>
                                        <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: "var(--font-geist-sans)" }}>
                                            Password Reset!
                                        </h1>
                                        <p className="text-muted-foreground text-sm font-sans mb-8">
                                            Your password has been updated successfully. You can now sign in with your new password.
                                        </p>
                                        <Button
                                            asChild
                                            className="w-full bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all hover:scale-105"
                                        >
                                            <Link href="/sign-in">Sign In Now</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-center mb-6">
                                            <div className="bg-surface-1 p-4 rounded-2xl border border-border mt-2">
                                                <Lock className="h-8 w-8 text-accent" />
                                            </div>
                                        </div>

                                        <h1
                                            className="text-foreground text-2xl font-semibold text-center mb-2"
                                            style={{ fontFamily: "var(--font-geist-sans)" }}
                                        >
                                            Set New Password
                                        </h1>
                                        <p className="text-muted-foreground text-sm font-sans text-center mb-8">
                                            Choose a strong password to keep your account with Bean secure.
                                        </p>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-accent text-sm font-sans mb-2">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Min. 6 characters"
                                                        className="w-full bg-surface-2 border border-border-raised rounded-xl py-3 px-4 pr-12 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                                        required
                                                        minLength={6}
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
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Re-type password"
                                                    className="w-full bg-surface-2 border border-border-raised rounded-xl py-3 px-4 text-foreground placeholder:text-muted-foreground font-sans focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                                    required
                                                />
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
                                                {isLoading ? "Updating..." : "Reset Password"}
                                            </Button>
                                        </form>
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
