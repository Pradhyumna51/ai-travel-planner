import React from "react"
import { cn } from "@/lib/utils"

export function CircularLoader({ className, size = "md" }) {
  const sizes = {
    sm: "size-4 border-2",
    md: "size-8 border-3",
    lg: "size-12 border-4",
  }
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid border-t-transparent border-primary",
        sizes[size],
        className
      )}
    >
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function DotsLoader({ className, size = "md" }) {
  const dotSizes = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  }
  return (
    <div className={cn("flex items-center gap-1 h-5", className)}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn("bg-primary rounded-full animate-bounce", dotSizes[size])}
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "1s" }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function WaveLoader({ className, size = "md" }) {
  const containerSizes = {
    sm: "h-4 gap-0.5",
    md: "h-6 gap-1",
    lg: "h-8 gap-1",
  }
  const barWidths = {
    sm: "w-0.5",
    md: "w-0.5",
    lg: "w-1",
  }
  const heights = {
    sm: ["6px", "10px", "14px", "10px", "6px"],
    md: ["8px", "16px", "24px", "16px", "8px"],
    lg: ["10px", "20px", "30px", "20px", "10px"],
  }
  return (
    <div className={cn("flex items-center justify-center", containerSizes[size], className)}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn("bg-primary rounded-full animate-pulse", barWidths[size])}
          style={{
            animationDelay: `${i * 100}ms`,
            height: heights[size][i],
            animationDuration: "1s"
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function Loader({ variant = "circular", size = "md", className }) {
  switch (variant) {
    case "circular":
      return <CircularLoader size={size} className={className} />
    case "dots":
      return <DotsLoader size={size} className={className} />
    case "wave":
      return <WaveLoader size={size} className={className} />
    default:
      return <CircularLoader size={size} className={className} />
  }
}
