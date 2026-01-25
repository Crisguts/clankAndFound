"use client"

import React from "react"
import { useCallback, useState } from "react"
import Image from "next/image"
import { Upload, X, ImageIcon } from "lucide-react"

interface ImageUploadProps {
  uploadedImage: string | null
  onImageUpload: (imageUrl: string | null) => void
  disabled?: boolean
}

export function ImageUpload({ uploadedImage, onImageUpload, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onImageUpload(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [disabled, onImageUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onImageUpload(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [onImageUpload])

  const handleRemove = useCallback(() => {
    onImageUpload(null)
  }, [onImageUpload])

  if (uploadedImage) {
    return (
      <div className="relative">
        <label className="block text-accent text-sm font-sans mb-2">
          Your reference image
        </label>
        {/* Layered uploaded image container */}
        <div className="bg-surface-1 rounded-2xl p-1">
          <div className="bg-surface-2 rounded-xl p-1 border border-border">
            <div className="relative rounded-lg overflow-hidden border border-border-raised bg-surface-3">
              <Image
                src={uploadedImage || "/placeholder.svg"}
                alt="Uploaded reference"
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="absolute top-3 right-3 p-2 bg-surface-2/90 backdrop-blur-sm rounded-full text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors border border-border-raised"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="absolute bottom-3 left-3 px-3 py-1 bg-surface-2/90 backdrop-blur-sm rounded-full border border-primary/30">
                <span className="text-primary text-xs font-sans">Image added</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <label className="block text-accent text-sm font-sans mb-2">
        Upload a reference image (optional)
      </label>
      {/* Layered dropzone container */}
      <div className="bg-surface-1 rounded-2xl p-1">
        <div className="bg-surface-2 rounded-xl p-1 border border-border">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all bg-surface-3 ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border-raised hover:border-primary/50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            
            <div className="flex flex-col items-center gap-3">
              {/* Icon with layered background */}
              <div className="bg-surface-1 p-1 rounded-full">
                <div className="p-4 bg-surface-2 rounded-full border border-border">
                  {isDragging ? (
                    <Upload className="h-8 w-8 text-primary" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-foreground font-sans text-sm">
                  {isDragging ? "Drop your image here" : "Drag and drop an image"}
                </p>
                <p className="text-muted-foreground text-xs font-sans mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-muted-foreground text-xs font-sans">
                PNG, JPG up to 10MB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
