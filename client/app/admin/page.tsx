"use client"

import React from "react"

import { useState, useCallback } from "react"
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
  CheckCheck
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type ItemStatus = "active" | "claimed" | "resolved"

export interface InventoryItem {
  id: string
  name: string
  description: string
  imageUrl: string | null
  category: string
  location: string
  dateAdded: string
  dateFound: string
  status: ItemStatus
  reportedBy: string
}

// Mock inventory data
const initialInventory: InventoryItem[] = [
  {
    id: "1",
    name: "Blue Backpack",
    description: "Navy blue backpack with white stripes, contains a water bottle and notebook",
    imageUrl: "/jack-front.png",
    category: "Bags",
    location: "Library - 2nd Floor",
    dateAdded: "2025-01-20",
    dateFound: "2025-01-19",
    status: "active",
    reportedBy: "Staff Member",
  },
  {
    id: "2",
    name: "Silver Watch",
    description: "Men's silver analog watch with leather strap",
    imageUrl: "/jack-side.png",
    category: "Accessories",
    location: "Cafeteria",
    dateAdded: "2025-01-18",
    dateFound: "2025-01-18",
    status: "claimed",
    reportedBy: "Security",
  },
  {
    id: "3",
    name: "Set of Keys",
    description: "5 keys on a red keychain with car remote",
    imageUrl: "/jack-back.png",
    category: "Keys",
    location: "Parking Lot B",
    dateAdded: "2025-01-15",
    dateFound: "2025-01-15",
    status: "resolved",
    reportedBy: "Visitor",
  },
]

const categories = ["All", "Bags", "Electronics", "Accessories", "Keys", "Clothing", "Documents", "Other"]

export default function AdminPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<ItemStatus | "all">("all")
  const [filterCategory, setFilterCategory] = useState("All")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // Filter inventory based on search and filters
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    const matchesCategory = filterCategory === "All" || item.category === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleAddItem = useCallback((newItem: Omit<InventoryItem, "id" | "dateAdded">) => {
    const item: InventoryItem = {
      ...newItem,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString().split("T")[0],
    }
    setInventory((prev) => [item, ...prev])
    setIsAddModalOpen(false)
  }, [])

  const handleEditItem = useCallback((updatedItem: InventoryItem) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    )
    setEditingItem(null)
  }, [])

  const handleDeleteItem = useCallback((id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleResolveItem = useCallback((id: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "resolved" as ItemStatus } : item
      )
    )
  }, [])

  const getStatusBadge = (status: ItemStatus) => {
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
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-sans bg-muted text-muted-foreground">
            <CheckCheck className="h-3 w-3" />
            Resolved
          </span>
        )
    }
  }

  const stats = {
    total: inventory.length,
    active: inventory.filter((i) => i.status === "active").length,
    claimed: inventory.filter((i) => i.status === "claimed").length,
    resolved: inventory.filter((i) => i.status === "resolved").length,
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
            Manage lost and found inventory - search, add, edit, and resolve items
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Items" value={stats.total} />
          <StatCard label="Active" value={stats.active} color="primary" />
          <StatCard label="Claimed" value={stats.claimed} color="yellow" />
          <StatCard label="Resolved" value={stats.resolved} color="muted" />
        </div>

        {/* Controls */}
        <div className="bg-surface-1 rounded-2xl p-2 mb-6">
          <div className="bg-surface-2 rounded-xl p-4 border border-border">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
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

              {/* Status Filter */}
              <div className="w-full md:w-[180px]">
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value as ItemStatus | "all")}
                >
                  <SelectTrigger className="w-full bg-surface-3 border-border-raised text-foreground font-sans text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-3 border-border-raised text-foreground">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="claimed">Claimed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="w-full md:w-[180px]">
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-full bg-surface-3 border-border-raised text-foreground font-sans text-sm">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-3 border-border-raised text-foreground">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add Button */}
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary text-primary-foreground rounded-lg px-4 py-2 font-sans transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(29,237,131,0.5)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-surface-1 rounded-2xl p-2">
          <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-3 border-b border-border">
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase tracking-wider">Item</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Location</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date Found</th>
                    <th className="text-left py-3 px-4 font-sans text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 font-sans text-xs text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground font-sans">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-3/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl || "/placeholder.svg"}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover bg-surface-3"
                              />
                            )}
                            <div>
                              <p className="font-medium text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground font-sans line-clamp-1 max-w-[200px]">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <span className="text-sm text-foreground font-sans">{item.category}</span>
                        </td>
                        <td className="py-4 px-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground font-sans">{item.location}</span>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground font-sans">{item.dateFound}</span>
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-2 rounded-lg hover:bg-surface-3 text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {item.status !== "resolved" && (
                              <button
                                onClick={() => handleResolveItem(item.id)}
                                className="p-2 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                title="Mark as Resolved"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingItem) && (
        <ItemModal
          item={editingItem}
          onSave={editingItem ? handleEditItem : handleAddItem}
          onClose={() => {
            setIsAddModalOpen(false)
            setEditingItem(null)
          }}
        />
      )}
    </div>
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

interface ItemModalProps {
  item: InventoryItem | null
  onSave: (item: any) => void
  onClose: () => void
}

function ItemModal({ item, onSave, onClose }: ItemModalProps) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    imageUrl: item?.imageUrl || "",
    category: item?.category || "Other",
    location: item?.location || "",
    dateFound: item?.dateFound || new Date().toISOString().split("T")[0],
    status: item?.status || "active",
    reportedBy: item?.reportedBy || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (item) {
      onSave({ ...item, ...formData })
    } else {
      onSave(formData)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-1 rounded-2xl p-2 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-surface-2 rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-geist-sans)" }}>
              {item ? "Edit Item" : "Add New Item"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-sans text-muted-foreground mb-1">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full bg-surface-3 border border-border-raised rounded-lg py-2 px-3 text-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-sans text-muted-foreground mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                className="w-full bg-surface-3 border border-border-raised rounded-lg py-2 px-3 text-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-1">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="w-full bg-surface-3 border-border-raised text-foreground font-sans text-sm">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-3 border-border-raised text-foreground">
                    {categories.slice(1).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-1">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as ItemStatus })}
                >
                  <SelectTrigger className="w-full bg-surface-3 border-border-raised text-foreground font-sans text-sm">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-3 border-border-raised text-foreground">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="claimed">Claimed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-sans text-muted-foreground mb-1">Location Found</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="w-full bg-surface-3 border border-border-raised rounded-lg py-2 px-3 text-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-1">Date Found</label>
                <input
                  type="date"
                  value={formData.dateFound}
                  onChange={(e) => setFormData({ ...formData, dateFound: e.target.value })}
                  required
                  className="w-full bg-surface-3 border border-border-raised rounded-lg py-2 px-3 text-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-sans text-muted-foreground mb-1">Reported By</label>
                <input
                  type="text"
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  className="w-full bg-surface-3 border border-border-raised rounded-lg py-2 px-3 text-foreground font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 rounded-lg bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(29,237,131,0.5)]"
              >
                {item ? "Save Changes" : "Add Item"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
