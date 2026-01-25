"use client"

import { Suspense, useState } from "react"
import Spline from "@splinetool/react-spline"

export default function SplineScene({ className }: { className?: string }) {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    const handleLoad = () => {
        setIsLoading(false)
        setHasError(false)
    }

    const handleError = (error: any) => {
        setIsLoading(false)
        setHasError(true)
    }

    return (
        <div className={`w-full h-full bg-background ${className || ""}`}>
            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <div className="text-foreground text-center">
                        <div className="text-lg mb-2">Loading 3D Scene...</div>
                        <div className="text-sm opacity-70">Please wait</div>
                    </div>
                </div>
            )}

            {/* Error state */}
            {hasError && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <div className="text-foreground text-center">
                        <div className="text-lg mb-2">3D Scene Unavailable</div>
                        <div className="text-sm opacity-70">Unable to load the 3D model</div>
                    </div>
                </div>
            )}

            {/* Spline Scene with color tint overlay */}
            {!hasError && (
                <div className="relative w-full h-full spline-themed overflow-hidden">
                    <Suspense fallback={null}>
                        <div className="w-full h-[calc(100%+100px)]">
                            <Spline
                                scene="https://prod.spline.design/l8gr6AhxxCqDIdBx/scene.splinecode"
                                onLoad={handleLoad}
                                onError={handleError}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    background: "transparent",
                                }}
                            />
                        </div>
                    </Suspense>
                </div>
            )}
        </div>
    )
}
