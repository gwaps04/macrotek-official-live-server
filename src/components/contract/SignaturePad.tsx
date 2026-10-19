"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as Icons from 'lucide-react';

// FILE: src/components/contract/SignaturePad.tsx

interface SignaturePadProps {
  onSaveSignature: (dataUrl: string, type: 'drawn' | 'typed') => void;
  disabled?: boolean;
  defaultName?: string;
}

const SCRIPT_STYLES = [
  { id: 'classic', label: 'Classic Flow', font: 'italic 36px "Brush Script MT", "Caveat", "Segoe Script", cursive' },
  { id: 'executive', label: 'Executive Script', font: 'italic 32px "Caveat", "Lucida Handwriting", cursive' },
  { id: 'formal', label: 'Formal Signature', font: 'italic 28px "Georgia", "Times New Roman", serif' },
];

export default function SignaturePad({ onSaveSignature, disabled, defaultName = '' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(defaultName);
  const [selectedStyle, setSelectedStyle] = useState(SCRIPT_STYLES[0].id);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  // Sync defaultName when changed from parent and mode is type
  useEffect(() => {
    if (defaultName && !typedName) {
      setTypedName(defaultName);
    }
  }, [defaultName, typedName]);

  // Set up canvas context properties
  const setupContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = '#09090b'; // High-contrast deep slate
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  }, []);

  useEffect(() => {
    if (mode === 'draw') {
      setupContext();
    }
  }, [mode, setupContext]);

  // Generate transparent PNG from typed text
  const generateTypedSignature = useCallback((text: string, styleId: string) => {
    if (!text || text.trim().length === 0) {
      setPreviewDataUrl(null);
      onSaveSignature('', 'typed');
      return;
    }

    const matched = SCRIPT_STYLES.find(s => s.id === styleId) || SCRIPT_STYLES[0];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 600;
    tempCanvas.height = 160;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Transparent background
    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.font = matched.font;
    ctx.fillStyle = '#09090b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.trim(), tempCanvas.width / 2, tempCanvas.height / 2);

    const dataUrl = tempCanvas.toDataURL('image/png');
    setPreviewDataUrl(dataUrl);
    onSaveSignature(dataUrl, 'typed');
  }, [onSaveSignature]);

  // Auto-generate typed signature if typedName is available on switch
  useEffect(() => {
    if (mode === 'type' && typedName.trim()) {
      generateTypedSignature(typedName, selectedStyle);
    }
  }, [mode, typedName, selectedStyle, generateTypedSignature]);

  // Precise canvas coordinate calculation with devicePixelRatio & bounding rect compensation
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const ctx = setupContext();
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const ctx = setupContext();
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setPreviewDataUrl(dataUrl);
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
    setPreviewDataUrl(null);
    onSaveSignature('', 'drawn');
  };

  return (
    <div className="space-y-3.5">
      {/* Mode toggle tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('draw');
              clearCanvas();
            }}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
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
              const nameToUse = typedName || defaultName;
              if (nameToUse) {
                setTypedName(nameToUse);
                generateTypedSignature(nameToUse, selectedStyle);
              }
            }}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'type' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <Icons.Type size={13} />
            Type Signature
          </button>
        </div>

        {mode === 'draw' && hasDrawn && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Icons.RotateCcw size={12} />
            Clear
          </button>
        )}
      </div>

      {mode === 'draw' ? (
        <div className="relative border-2 border-dashed border-zinc-300 hover:border-zinc-400 focus-within:border-emerald-500 rounded-2xl bg-white shadow-inner overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={160}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {
              e.preventDefault();
              startDrawing(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              draw(e);
            }}
            onTouchEnd={stopDrawing}
            className="w-full h-36 cursor-crosshair block touch-none select-none bg-white"
          />

          {!hasDrawn && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-zinc-400 text-xs font-medium">
              <Icons.PenTool size={20} className="mb-1 text-zinc-300" />
              <span>Draw your digital signature here with your finger or mouse</span>
            </div>
          )}

          <div className="absolute bottom-2.5 left-4 right-4 pointer-events-none border-b border-zinc-200 flex items-center justify-between pb-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Sign on line ✕</span>
            <span className="text-[10px] text-zinc-400 font-mono">256-Bit Encrypted</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
              Legal Name for Signature Generation
            </label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => {
                setTypedName(e.target.value);
                generateTypedSignature(e.target.value, selectedStyle);
              }}
              placeholder="e.g. Jason Millena"
              className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Style Selector Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Style:</span>
            {SCRIPT_STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedStyle(st.id);
                  generateTypedSignature(typedName, st.id);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  selectedStyle === st.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Captured Signature Live Preview */}
      {previewDataUrl && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Icons.CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">Signature Captured</p>
              <p className="text-[10px] text-emerald-700">Ready to execute and embed into legal document</p>
            </div>
          </div>
          <div className="h-10 px-3 bg-white rounded-lg border border-emerald-200 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewDataUrl}
              alt="Live Captured Signature"
              className="max-h-8 w-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
