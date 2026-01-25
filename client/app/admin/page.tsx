"use client"

import React from "react"
import { useState, useCallback, useEffect } from "react"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import {
  Search,
  Plus,
  Pencil,
  CheckCircle,
  Trash2,
  X,
  Package,
  Clock,
  CheckCheck,
  RefreshCw,
  AlertCircle
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export type ItemStatus = "active" | "claimed" | "archived"
type ViewTab = "inventory" | "matches" | "inquiries"

// API base URL for Express backend
const API_BASE = "http://localhost:8080"

interface InventoryItem {
  id: string
  description: string
  image_url: string | null
  location_found: string | null
  status: ItemStatus
  created_at: string
  gemini_data?: any
}

interface Match {
  id: string
  score: number
  status: string
  admin_notes: string | null
  inquiry: any
  inventory: any
}

interface Inquiry {
  id: string
  description: string
  image_url: string | null
  status: string
  created_at: string
  match_counts?: { pending: number; confirmed: number }
}

const categories = ["All", "Bags", "Electronics", "Accessories", "Keys", "Clothing", "Documents", "Other"]

export default function AdminPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ViewTab>("inventory")
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<ItemStatus | "all">("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ image?: string; description?: string; location?: string }>({})

  // Check auth and role
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setUser(null)
        setIsAuthorized(false)
        setIsLoading(false)
        return
      }

      setUser(session.user)

      // Check role via profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()

      setIsAuthorized(profile?.role === "assistant")
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Fetch data based on active tab
  useEffect(() => {
    if (!isAuthorized) return

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const headers = { "Authorization": `Bearer ${session.access_token}` }

      try {
        if (activeTab === "inventory") {
          const params = new URLSearchParams()
          if (searchQuery) params.append("search", searchQuery)
          if (filterStatus !== "all") params.append("status", filterStatus)

          const res = await fetch(`${API_BASE}/api/inventory?${params}`, { headers })
          const data = await res.json()
          if (res.ok) setInventory(data.data || [])
          else throw new Error(data.error)
        } else if (activeTab === "matches") {
          const res = await fetch(`${API_BASE}/api/matches?status=pending`, { headers })
          const data = await res.json()
          if (res.ok) setMatches(data.data || [])
          else throw new Error(data.error)
        } else if (activeTab === "inquiries") {
          const res = await fetch(`${API_BASE}/api/inquiries`, { headers })
          const data = await res.json()
          if (res.ok) setInquiries(data.data || [])
          else throw new Error(data.error)
        }

        // Also fetch stats
        const statsRes = await fetch(`${API_BASE}/api/stats`, { headers })
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.data)
        }
      } catch (err: any) {
        toast({
          title: "Error fetching data",
          description: err.message,
          variant: "destructive",
        })
        setError(err.message)
      }
    }

    fetchData()
  }, [activeTab, isAuthorized, searchQuery, filterStatus])

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return { "Authorization": `Bearer ${session?.access_token}` }
  }

  const handleDeleteItem = useCallback((id: string) => {
    setDeleteConfirmId(id)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmId) return

    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/api/inventory/${deleteConfirmId}`, { method: "DELETE", headers })
      if (!res.ok) throw new Error("Failed to delete")
      setInventory(prev => prev.filter(item => item.id !== id))
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
      setError(err.message)
    } finally {
      setDeleteConfirmId(null)
    }
  }, [deleteConfirmId])

  const handleResolveItem = useCallback(async (id: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "claimed" })
      })
      if (!res.ok) throw new Error("Failed to update")
      setInventory(prev => prev.map(item =>
        item.id === id ? { ...item, status: "claimed" as ItemStatus } : item
      ))
      toast({
        title: "Item updated",
        description: "Marked as claimed successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }, [])

  const handleConfirmMatch = useCallback(async (matchId: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/api/match/${matchId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" })
      })
      if (!res.ok) throw new Error("Failed to confirm")
      setMatches(prev => prev.filter(m => m.id !== matchId))
      toast({
        title: "Match Confirmed",
        description: "The user has been notified via email.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }, [])

  const handleRejectMatch = useCallback(async (matchId: string) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/api/match/${matchId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" })
      })
      if (!res.ok) throw new Error("Failed to reject")
      setMatches(prev => prev.filter(m => m.id !== matchId))
      toast({
        title: "Match Rejected",
        description: "The match has been removed.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }

  }, [])

  const handleRematch = useCallback(async (inquiryId: string) => {
    try {
      setIsLoading(true)
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/api/inquiry/${inquiryId}/rematch`, {
        method: "POST",
        headers
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to run rematch")

      // Update inquiries list to reflect any changes (though primarily logic is backend)
      // Ideally we might want to refresh the list or show a success message
      const matchCount = data.matches?.length || 0;
      let description: React.ReactNode = `Found ${matchCount} matches.`;

      if (matchCount > 0) {
        description = (
          <div className="flex flex-col gap-1 mt-2">
            <p>Found {matchCount} potential matches:</p>
            <ul className="list-disc list-inside text-xs">
              {data.matches.slice(0, 3).map((m: any) => (
                <li key={m.id} className="truncate max-w-[200px]">
                  {m.inventory?.description || "Unknown item"} ({(m.score * 100).toFixed(0)}%)
                </li>
              ))}
            </ul>
            {matchCount > 3 && <p className="text-xs text-muted-foreground">...and {matchCount - 3} more</p>}
          </div>
        );
      } else {
        description = "No new matches found at this time. AI analysis complete.";
      }

      toast({
        title: matchCount > 0 ? "Rematch Successful" : "Rematch Complete",
        description,
      })

      // Refresh inquiries
      const inqRes = await fetch(`${API_BASE}/api/inquiries`, { headers })
      const inqData = await inqRes.json()
      if (inqRes.ok) setInquiries(inqData.data || [])

    } catch (err: any) {
      toast({
        title: "Rematch Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleAddItem = useCallback(async (formData: FormData) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/api/inventory`, {
        method: "POST",
        headers: { "Authorization": headers.Authorization },
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add item")
      }
      const data = await res.json()
      setInventory(prev => [data.data, ...prev])
      setIsAddModalOpen(false)
      toast({
        title: "Item Added",
        description: "The item has been successfully added to inventory.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
      setError(err.message)
    }
  }, [])

  const handleEditItem = useCallback(async (id: string, updates: { description?: string; location_found?: string; status?: ItemStatus }) => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error("Failed to update item")
      const data = await res.json()
      setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
      setEditingItem(null)
      toast({
        title: "Item Updated",
        description: "The item has been successfully updated.",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
      setError(err.message)
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-sans bg-primary/20 text-primary">
            <Package className="h-3 w-3" />
            Active
          </span>
        )
      case "claimed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-sans bg-yellow-500/20 text-yellow-600">
            <Clock className="h-3 w-3" />
            Claimed
          </span>
        )
      case "archived":
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-sans bg-muted text-muted-foreground">
            <CheckCheck className="h-3 w-3" />
            {status}
          </span>
        )
      default:
        return <span className="text-xs">{status}</span>
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="w-full min-h-screen bg-background">
        <Header />
        <main className="max-w-xl mx-auto pt-32 px-4 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Login Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access the admin dashboard.</p>
          <Button asChild><Link href="/sign-in">Sign In</Link></Button>
        </main>
      </div>
    )
  }

  // Not authorized (not assistant)
  if (!isAuthorized) {
    return (
      <div className="w-full min-h-screen bg-background">
        <Header />
        <main className="max-w-xl mx-auto pt-32 px-4 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need assistant privileges to access this page.</p>
          <Button asChild variant="outline"><Link href="/">Go Home</Link></Button>
        </main>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <Header />

      <main className="max-w-[1400px] mx-auto pt-24 px-4 md:px-6 pb-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-geist-sans)" }}>
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground font-sans text-sm">
            Manage lost and found inventory, review matches, and track inquiries
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Active Items" value={stats.inventory?.active || 0} color="primary" />
            <StatCard label="Pending Matches" value={stats.matches?.pending_review || 0} color="yellow" />
            <StatCard label="Today's Inquiries" value={stats.inquiries?.today || 0} />
            <StatCard label="Resolved" value={stats.inquiries?.resolved || 0} color="muted" />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {(["inventory", "matches", "inquiries"] as ViewTab[]).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
              {tab === "matches" && stats?.matches?.pending_review > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-yellow-950 text-xs rounded-full">
                  {stats.matches.pending_review}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Search Controls */}
        {activeTab === "inventory" && (
          <div className="bg-surface-1 rounded-2xl p-2 mb-6">
            <div className="bg-surface-2 rounded-xl p-4 border border-border flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items..."
                  className="w-full bg-surface-3 border border-border-raised rounded-lg py-2 pl-10 pr-4 text-foreground placeholder:text-muted-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ItemStatus | "all")}>
                <SelectTrigger className="w-full md:w-[180px] bg-surface-3 border-border-raised">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="bg-surface-1 rounded-2xl p-2">
            <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-3 border-b border-border">
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Item</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase hidden md:table-cell">Location</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase hidden md:table-cell">Date Added</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Status</th>
                    <th className="text-right py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No items found</td></tr>
                  ) : inventory.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-3/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <img src={item.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-surface-3" />
                          )}
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">{item.description?.slice(0, 50)}...</p>
                            <p className="text-xs text-muted-foreground">{item.gemini_data?.category || "Uncategorized"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell text-sm text-muted-foreground">{item.location_found || "-"}</td>
                      <td className="py-4 px-4 hidden md:table-cell text-sm text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingItem(item)} className="p-2 rounded-lg hover:bg-accent/20 text-muted-foreground hover:text-accent" title="Edit">
                            <Pencil className="h-4 w-4" />
                          </button>
                          {item.status === "active" && (
                            <button onClick={() => handleResolveItem(item.id)} className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary" title="Mark Claimed">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteItem(item.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive" title="Archive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === "matches" && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No pending matches to review</div>
            ) : matches.map((match) => (
              <div key={match.id} className="bg-surface-1 rounded-2xl p-2">
                <div className="bg-surface-2 rounded-xl border border-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Match Score: <strong className="text-primary">{(match.score * 100).toFixed(0)}%</strong></span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRejectMatch(match.id)}>Reject</Button>
                      <Button size="sm" onClick={() => handleConfirmMatch(match.id)}>Confirm Match</Button>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-surface-3 rounded-lg p-4 border border-border-raised">
                      <p className="text-xs text-muted-foreground mb-2">User's Lost Item</p>
                      {match.inquiry?.image_url && <img src={match.inquiry.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />}
                      <p className="text-sm">{match.inquiry?.description}</p>
                    </div>
                    <div className="bg-surface-3 rounded-lg p-4 border border-border-raised">
                      <p className="text-xs text-muted-foreground mb-2">Found Item</p>
                      {match.inventory?.image_url && <img src={match.inventory.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />}
                      <p className="text-sm">{match.inventory?.description}</p>
                    </div>
                  </div>
                  {match.admin_notes && <p className="text-xs text-muted-foreground mt-4">AI Notes: {match.admin_notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inquiries Tab */}
        {activeTab === "inquiries" && (
          <div className="bg-surface-1 rounded-2xl p-2">
            <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-3 border-b border-border">
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Inquiry</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase hidden md:table-cell">Date</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Status</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Matches</th>
                    <th className="text-right py-3 px-4 font-sans text-xs text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.length === 0 ? (
                    <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">No inquiries found</td></tr>
                  ) : inquiries.map((inq) => (
                    <tr key={inq.id} className="border-b border-border last:border-0 hover:bg-surface-3/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {inq.image_url && <img src={inq.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                          <p className="text-sm line-clamp-2">{inq.description?.slice(0, 80)}...</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell text-sm text-muted-foreground">{new Date(inq.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4">{getStatusBadge(inq.status)}</td>
                      <td className="py-4 px-4">
                        <span className="text-xs">
                          {inq.match_counts?.pending || 0} pending, {inq.match_counts?.confirmed || 0} confirmed
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRematch(inq.id)}
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Rematch
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Item Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 rounded-2xl border border-border w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Add Found Item</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-surface-3 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const form = e.currentTarget
                const formData = new FormData(form)
                const imageFile = formData.get("image") as File;

                if (!imageFile || imageFile.size === 0) {
                  setValidationErrors({ image: "Please upload an image." })
                  return
                }

                setValidationErrors({})
                await handleAddItem(formData)
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Item Image *</label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      className={`w-full bg-surface-3 border rounded-lg p-3 text-sm ${validationErrors.image ? "border-destructive ring-1 ring-destructive" : "border-border-raised"}`}
                      onChange={() => setValidationErrors(prev => ({ ...prev, image: undefined }))}
                    />
                    {validationErrors.image && (
                      <div className="mt-1 text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.image}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location Found</label>
                    <input type="text" name="location_found" placeholder="e.g., Library 2nd floor" className="w-full bg-surface-3 border border-border-raised rounded-lg p-3 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Add to Inventory</Button>
                </div>
              </form>
            </div>
          </div>
        )
        }

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-2 rounded-2xl border border-border w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Edit Item</h2>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-surface-3 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const form = e.currentTarget
                const formData = new FormData(form)

                const description = formData.get("description") as string;
                if (!description.trim()) {
                  setValidationErrors({ description: "Please enter a description." })
                  return
                }

                setValidationErrors({})
                await handleEditItem(editingItem.id, {
                  description: description,
                  location_found: formData.get("location_found") as string,
                  status: formData.get("status") as ItemStatus,
                })
              }}>
                <div className="space-y-4">
                  {editingItem.image_url && (
                    <img src={editingItem.image_url} alt="" className="w-full h-40 object-cover rounded-lg" />
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      name="description"
                      defaultValue={editingItem.description}
                      rows={3}
                      className={`w-full bg-surface-3 border rounded-lg p-3 text-sm ${validationErrors.description ? "border-destructive ring-1 ring-destructive" : "border-border-raised"}`}
                      onChange={() => setValidationErrors(prev => ({ ...prev, description: undefined }))}
                    />
                    {validationErrors.description && (
                      <div className="mt-1 text-destructive text-xs flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {validationErrors.description}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Location Found</label>
                    <input type="text" name="location_found" defaultValue={editingItem.location_found || ""} className="w-full bg-surface-3 border border-border-raised rounded-lg p-3 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select name="status" defaultValue={editingItem.status} className="w-full bg-surface-3 border border-border-raised rounded-lg p-3 text-sm">
                      <option value="active">Active</option>
                      <option value="claimed">Claimed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {
        deleteConfirmId && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <div
              className="bg-surface-1 rounded-2xl p-1 shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-surface-2 rounded-xl p-1 border border-border">
                <div className="bg-surface-3 rounded-lg p-6 border border-border-raised">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-destructive/10 p-3 rounded-full">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-geist-sans)" }}>
                      Delete Item?
                    </h3>
                  </div>
                  <p className="text-muted-foreground font-sans text-sm mb-6">
                    Are you sure you want to delete this item? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 rounded-full border-border text-foreground hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmDelete}
                      className="flex-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:scale-105 transition-all duration-200"
                    >
                      Yes, Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const bgClass = color === "primary" ? "bg-primary/10" : color === "yellow" ? "bg-yellow-500/10" : "bg-surface-3"
  const textClass = color === "primary" ? "text-primary" : color === "yellow" ? "text-yellow-600" : "text-foreground"

  return (
    <div className="bg-surface-1 rounded-xl p-1">
      <div className={`${bgClass} rounded-lg p-4 border border-border`}>
        <p className="text-muted-foreground font-sans text-xs mb-1">{label}</p>
        <p className={`text-2xl font-bold ${textClass}`}>{value}</p>
      </div>
    </div>
  )
}
