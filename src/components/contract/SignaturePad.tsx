// FILE: src/components/contract/SignaturePad.tsx
"use client";

import React, { useRef, useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

interface SignaturePadProps {
  onSign: (signatureBase64: string | null) => void;
  isSubmitting: boolean;
  requireSignature: boolean;
}

export default function SignaturePad({ onSign, isSubmitting, requireSignature }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Set up canvas context for smooth lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#18181b'; // zinc-900
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = () => {
    if (requireSignature && !hasDrawn) {
      alert("Please provide your signature before accepting.");
      return;
    }

    let base64 = null;
    if (hasDrawn && canvasRef.current) {
      base64 = canvasRef.current.toDataURL('image/png');
    }
    
    onSign(base64);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-900">
          {requireSignature ? "Required Electronic Signature" : "Optional Signature"}
        </h4>
        {hasDrawn && (
          <button 
            onClick={clearSignature}
            className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Icons.Eraser size={12} /> Clear Signature
          </button>
        )}
      </div>

      <div className="w-full bg-white border-2 border-dashed border-zinc-300 rounded-2xl overflow-hidden relative touch-none">
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-zinc-300 font-medium text-sm select-none">Draw your signature here...</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-[200px] cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerOut={stopDrawing}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
        <p className="text-[11px] text-zinc-500 font-medium flex-1 text-center sm:text-left leading-relaxed">
          By clicking accept, you acknowledge and agree to the terms outlined in this document. 
          Your IP address and timestamp will be permanently recorded.
        </p>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (requireSignature && !hasDrawn)}
          className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          {isSubmitting ? (
            <React.Fragment>
              <Icons.Loader2 size={16} className="animate-spin" /> Processing...
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Icons.CheckCircle2 size={16} /> Sign &amp; Accept
            </React.Fragment>
          )}
        </button>
      </div>
    </div>
  );
}