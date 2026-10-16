"use client";

import React, { useRef, useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

// FILE: src/components/contract/SignaturePad.tsx

interface SignaturePadProps {
  onSaveSignature: (dataUrl: string, type: 'drawn' | 'typed') => void;
  disabled?: boolean;
}

export default function SignaturePad({ onSaveSignature, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');

  // Setup canvas resolution and styling
  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a'; // Deep slate
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSaveSignature(dataUrl, 'drawn');
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSaveSignature('', 'drawn');
  };

  const handleTypedChange = (val: string) => {
    setTypedName(val);
    if (val.trim()) {
      // Create a virtual canvas to convert typed signature font to data URL
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 450;
      tempCanvas.height = 120;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.font = 'italic 34px "Brush Script MT", "Caveat", "Segoe Script", cursive';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, tempCanvas.width / 2, tempCanvas.height / 2);
        onSaveSignature(tempCanvas.toDataURL('image/png'), 'typed');
      }
    } else {
      onSaveSignature('', 'typed');
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setMode('draw');
            clearCanvas();
          }}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
            mode === 'draw' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <Icons.PenTool size={13} />
          Draw Signature
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('type');
            if (typedName) handleTypedChange(typedName);
          }}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
            mode === 'type' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <Icons.Type size={13} />
          Type Signature
        </button>
        {mode === 'draw' && hasDrawn && (
          <button
            type="button"
            onClick={clearCanvas}
            className="ml-auto text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
          >
            <Icons.RotateCcw size={12} />
            Clear
          </button>
        )}
      </div>

      {mode === 'draw' ? (
        <div className="relative border-2 border-dashed border-zinc-300 rounded-2xl bg-zinc-50 overflow-hidden touch-none">
          <canvas
            ref={canvasRef}
            width={500}
            height={140}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-32 cursor-crosshair block"
          />
          {!hasDrawn && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-zinc-400 text-xs font-medium">
              Draw your digital signature here with mouse or finger
            </div>
          )}
          <div className="absolute bottom-2 left-4 pointer-events-none border-b border-zinc-300 w-3/4">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Sign on line ✕</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={typedName}
            onChange={(e) => handleTypedChange(e.target.value)}
            placeholder="Type your full legal name..."
            className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {typedName && (
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">Generated Signature Preview</span>
              <p className="text-3xl italic font-serif text-zinc-900 tracking-wide font-medium">
                {typedName}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
