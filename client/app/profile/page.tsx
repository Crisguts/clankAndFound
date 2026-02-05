"use client"

import React from "react"
import { useState, useCallback, useEffect } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Package, CheckCircle, Clock, AlertCircle, X, MapPin, Sparkles, MessageSquare, ChevronRight, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { isDemoMode, DEMO_USER, DEMO_MESSAGE, DEMO_INQUIRIES, DEMO_MATCHES } from "@/lib/demo-mode"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const API_BASE = "http://localhost:8080"

interface Inquiry {
    id: string
    description: string
    image_url: string | null
    status: string
    created_at: string
    match_count?: number
    refinement?: {
        token: string
        question_count: number
    } | null
}

interface Match {
    id: string
    score: number
    status: string
    inquiry: {
        id: string
        description: string
        image_url: string | null
        created_at: string
    }
    inventory: {
        id: string
        description: string
        image_url: string | null
        location_found: string | null
    }
}

export default function ProfilePage() {
    const { toast } = useToast()
    const [user, setUser] = useState<any>(null)
    const [inquiries, setInquiries] = useState<Inquiry[]>([])
    const [matches, setMatches] = useState<Match[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"inquiries" | "matches" | "history">("matches")
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
    const [claimedItemName, setClaimedItemName] = useState("")
    const isDemo = isDemoMode()

    useEffect(() => {
        // In demo mode, use mock data
        if (isDemo) {
            setUser(DEMO_USER)
            setInquiries(DEMO_INQUIRIES as Inquiry[])
            setMatches(DEMO_MATCHES as Match[])
            setIsLoading(false)
            return
        }

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                window.location.href = "/sign-in"
                return
            }
            setUser(session.user)

            // Check if assistant - redirect to admin
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", session.user.id)
                .single()

            if (profile?.role === "assistant") {
                window.location.href = "/admin"
                return
            }

            await fetchData(session.access_token)
            setIsLoading(false)
        }
        init()
    }, [isDemo])

    const fetchData = async (token: string) => {
        try {
            const headers = { "Authorization": `Bearer ${token}` }

            const [inqRes, matchRes] = await Promise.all([
                fetch(`${API_BASE}/api/my/inquiries`, { headers }),
                fetch(`${API_BASE}/api/my/matches`, { headers }),
            ])

            const inqData = await inqRes.json()
            const matchData = await matchRes.json()

            if (inqRes.ok) setInquiries(inqData.data || [])
            if (matchRes.ok) setMatches(matchData.data || [])
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleClaim = useCallback(async (matchId: string, itemDescription: string) => {
        // In demo mode, simulate the claim
        if (isDemo) {
            setClaimedItemName(itemDescription)
            setMatches(prev => prev.filter(m => m.id !== matchId))
            setIsSuccessDialogOpen(true)
            return
        }

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const res = await fetch(`${API_BASE}/api/my/matches/${matchId}/claim`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${session.access_token}` },
            })

            if (!res.ok) throw new Error("Failed to claim")

            setClaimedItemName(itemDescription)
            setMatches(prev => prev.filter(m => m.id !== matchId))
            setIsSuccessDialogOpen(true)
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to claim item",
                variant: "destructive",
            })
        }
    }, [isDemo])

    const getStatusBadge = (inq: Inquiry) => {
        // If there's a pending refinement session, show refinement status
        if (inq.refinement && inq.match_count && inq.match_count > 5) {
            return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-600"><MessageSquare className="h-3 w-3" />Needs Your Input</span>
        }

        switch (inq.status) {
            case "submitted":
                if (inq.match_count && inq.match_count > 0) {
                    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-600"><Clock className="h-3 w-3" />{inq.match_count} potential matches</span>
                }
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-600"><Clock className="h-3 w-3" />Searching</span>
            case "matched":
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/20 text-primary"><CheckCircle className="h-3 w-3" />Match Found!</span>
            case "resolved":
                return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"><CheckCircle className="h-3 w-3" />Resolved</span>
            default:
                return <span className="text-xs">{inq.status}</span>
        }
    }

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="w-full min-h-screen bg-background">
                <Header />
                <main className="max-w-xl mx-auto pt-32 px-4 text-center">
                    <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Login Required</h1>
                    <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
                    <Button asChild><Link href="/sign-in">Sign In</Link></Button>
                </main>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-background">
            <Header />

            {/* Demo Mode Banner */}
            {isDemo && (
                <div className="fixed top-16 left-0 right-0 z-40 bg-amber-500/90 text-amber-950 py-2 px-4 text-center text-sm font-medium backdrop-blur-sm">
                    <AlertTriangle className="inline-block w-4 h-4 mr-2" />
                    {DEMO_MESSAGE}
                </div>
            )}

            <main className={`max-w-4xl mx-auto ${isDemo ? 'pt-32' : 'pt-24'} px-4 md:px-6 pb-12`}>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-geist-sans)" }}>
                        My Profile
                    </h1>
                    <p className="text-muted-foreground font-sans text-sm">
                        Track your lost items and claim matches
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={activeTab === "matches" ? "default" : "outline"}
                        onClick={() => setActiveTab("matches")}
                    >
                        Matches {matches.length > 0 && <span className="ml-2 px-2 py-0.5 bg-primary-foreground/20 rounded-full text-xs">{matches.length}</span>}
                    </Button>
                    <Button
                        variant={activeTab === "inquiries" ? "default" : "outline"}
                        onClick={() => setActiveTab("inquiries")}
                    >
                        My Inquiries
                    </Button>
                </div>

                {/* Matches Tab */}
                {activeTab === "matches" && (
                    <div className="space-y-4">
                        {matches.length === 0 ? (
                            <div className="bg-surface-1 rounded-2xl p-2">
                                <div className="bg-surface-2 rounded-xl border border-border p-12 text-center">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No matches yet</p>
                                    <p className="text-sm text-muted-foreground mt-2">Check back later or submit a new lost item report</p>
                                    <Button asChild className="mt-4"><Link href="/search">Report Lost Item</Link></Button>
                                </div>
                            </div>
                        ) : matches.map((match) => (
                            <div key={match.id} className="bg-surface-1 rounded-2xl p-2">
                                <div className="bg-surface-2 rounded-xl border border-border p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary/20 text-primary font-medium">
                                            <CheckCircle className="h-4 w-4" />
                                            Match Found!
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {(match.score * 100).toFixed(0)}% confidence
                                        </span>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-surface-3 rounded-lg p-4 border border-border-raised">
                                            <p className="text-xs text-muted-foreground mb-2">Your Lost Item</p>
                                            {match.inquiry.image_url && (
                                                <img src={match.inquiry.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                                            )}
                                            <p className="text-sm line-clamp-3">{match.inquiry.description}</p>
                                        </div>
                                        <div className="bg-surface-3 rounded-lg p-4 border border-border-raised">
                                            <p className="text-xs text-muted-foreground mb-2">Found Item</p>
                                            {match.inventory.image_url && (
                                                <img src={match.inventory.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                                            )}
                                            <p className="text-sm line-clamp-3">{match.inventory.description}</p>
                                            {match.inventory.location_found && (
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {match.inventory.location_found}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleClaim(match.id, match.inventory.description)}
                                        className="w-full bg-primary text-primary-foreground hover:scale-[1.02] transition-transform"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Claim This Item
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Inquiries Tab */}
                {activeTab === "inquiries" && (
                    <div className="bg-surface-1 rounded-2xl p-2">
                        <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
                            {inquiries.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No inquiries yet</p>
                                    <Button asChild className="mt-4"><Link href="/search">Report Lost Item</Link></Button>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-surface-3 border-b border-border">
                                            <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Item</th>
                                            <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Date</th>
                                            <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Status</th>
                                            <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inquiries.map((inq) => (
                                            <tr key={inq.id} className="border-b border-border last:border-0">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {inq.image_url && <img src={inq.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                                                        <p className="text-sm line-clamp-1">{inq.description?.slice(0, 60)}...</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-muted-foreground">{new Date(inq.created_at).toLocaleDateString()}</td>
                                                <td className="py-4 px-4">{getStatusBadge(inq)}</td>
                                                <td className="py-4 px-4">
                                                    {inq.refinement && inq.match_count && inq.match_count > 5 ? (
                                                        <Button asChild size="sm" className="rounded-full bg-purple-600 hover:bg-purple-700 text-white">
                                                            <Link href={`/refine?token=${inq.refinement.token}`}>
                                                                Answer Questions
                                                                <ChevronRight className="ml-1 h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    ) : inq.status === "matched" ? (
                                                        <Button asChild size="sm" variant="outline" className="rounded-full">
                                                            <Link href="#" onClick={() => setActiveTab("matches")}>
                                                                View Match
                                                            </Link>
                                                        </Button>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
                <DialogContent className="max-w-md bg-surface-1 border-border p-2">
                    <div className="bg-surface-2 rounded-xl p-6 border border-border">
                        <DialogHeader>
                            <div className="flex justify-center mb-6">
                                <div className="bg-primary/10 p-4 rounded-full relative">
                                    <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                </div>
                            </div>
                            <DialogTitle className="text-2xl font-bold text-center mb-2" style={{ fontFamily: "var(--font-geist-sans)" }}>
                                Success!
                            </DialogTitle>
                            <DialogDescription className="text-center text-muted-foreground text-sm font-sans">
                                You have successfully claimed the <strong>{claimedItemName || "item"}</strong>.
                                Bean has notified the staff that you're on your way!
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-4">
                            <div className="bg-surface-3 rounded-lg p-4 border border-border-raised flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Pickup Location</p>
                                    <p className="text-xs text-muted-foreground">Lost & Found Central Hub, Building C, Room 402</p>
                                </div>
                            </div>

                            <Button
                                onClick={() => setIsSuccessDialogOpen(false)}
                                className="w-full bg-primary text-primary-foreground rounded-full py-6 font-semibold transition-all hover:scale-105"
                            >
                                Great, Thanks!
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
