"use client"

import React, { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eraser, PenTool, Type, Check, Sparkles } from "lucide-react"

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void
  signerName?: string
  width?: number
  height?: number
  className?: string
}

export function SignatureCanvas({
  onSignatureChange,
  signerName = "",
  width = 600,
  height = 200,
  className = "",
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasStroke, setHasStroke] = useState(false)
  const [mode, setMode] = useState<"draw" | "type">("draw")
  const [typedName, setTypedName] = useState(signerName)
  const [selectedFont, setSelectedFont] = useState<string>("cursive")

  useEffect(() => {
    if (signerName && !typedName) {
      setTypedName(signerName)
    }
  }, [signerName, typedName])

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
    onSignatureChange(null)
  }

  // Get coords relative to canvas
  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ("touches" in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
  }

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#4f46e5" // Indigo / deep brand ink

    setIsDrawing(true)
    setHasStroke(true)
  }

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    onSignatureChange(dataUrl)
  }

  // Render typed signature into canvas
  const adoptTypedSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const nameToRender = typedName.trim() || signerName.trim() || "Signed"
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.fillStyle = "#4f46e5"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    if (selectedFont === "cursive") {
      ctx.font = "italic 44px 'Brush Script MT', 'Dancing Script', 'Caveat', cursive"
    } else if (selectedFont === "formal") {
      ctx.font = "italic 36px 'Times New Roman', 'Playfair Display', serif"
    } else {
      ctx.font = "500 38px 'Segoe Print', 'Comic Sans MS', handwriting"
    }

    ctx.fillText(nameToRender, canvas.width / 2, canvas.height / 2)
    ctx.restore()

    setHasStroke(true)
    const dataUrl = canvas.toDataURL("image/png")
    onSignatureChange(dataUrl)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mode Toggle Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border/60 rounded-lg">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${
              mode === "draw"
                ? "bg-background text-foreground shadow-xs font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            Draw Freehand
          </button>
          <button
            type="button"
            onClick={() => setMode("type")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${
              mode === "type"
                ? "bg-background text-foreground shadow-xs font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            Adopt Styled Script
          </button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-rose-400 h-8"
        >
          <Eraser className="h-3.5 w-3.5 mr-1" />
          Clear Pad
        </Button>
      </div>

      {/* If type mode is active, show font & text controls */}
      {mode === "type" && (
        <div className="p-3 bg-muted/20 border border-border/50 rounded-xl space-y-2.5">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full legal name..."
              className="text-sm h-9 bg-background"
            />
            <Button
              type="button"
              onClick={adoptTypedSignature}
              className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Apply to Canvas
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground text-[11px]">Script Style:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFont("cursive")
                setTimeout(adoptTypedSignature, 10)
              }}
              className={`px-2.5 py-1 rounded border text-[11px] font-serif italic ${
                selectedFont === "cursive"
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold"
                  : "border-border text-muted-foreground"
              }`}
            >
              Calligraphy Script
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedFont("formal")
                setTimeout(adoptTypedSignature, 10)
              }}
              className={`px-2.5 py-1 rounded border text-[11px] font-serif italic ${
                selectedFont === "formal"
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold"
                  : "border-border text-muted-foreground"
              }`}
            >
              Executive Serif
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedFont("handwriting")
                setTimeout(adoptTypedSignature, 10)
              }}
              className={`px-2.5 py-1 rounded border text-[11px] ${
                selectedFont === "handwriting"
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold"
                  : "border-border text-muted-foreground"
              }`}
            >
              Casual Script
            </button>
          </div>
        </div>
      )}

      {/* Canvas Drawing Surface */}
      <div className="relative border-2 border-dashed border-border/80 hover:border-indigo-500/50 transition-colors rounded-xl bg-background/95 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: "none", width: "100%", height: `${height}px` }}
          className="cursor-crosshair block"
        />

        {/* Signature Baseline Marker */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center gap-2 pointer-events-none opacity-40">
          <span className="text-xs font-serif font-bold text-muted-foreground">✕</span>
          <div className="h-px bg-muted-foreground/60 flex-1 border-b border-dashed border-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Sign on line
          </span>
        </div>

        {/* Empty state hint */}
        {!hasStroke && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5" />
              Draw signature with finger, stylus, or mouse above
            </p>
          </div>
        )}

        {/* Active verified mark */}
        {hasStroke && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium pointer-events-none">
            <Check className="h-3 w-3" />
            Signature Captured
          </div>
        )}
      </div>
    </div>
  )
}
