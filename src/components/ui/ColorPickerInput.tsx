"use client";

import { useState } from 'react';

interface ColorPickerInputProps {
  name: string;
  defaultValue?: string;
}

export default function ColorPickerInput({ name, defaultValue = '#ffffff' }: ColorPickerInputProps) {
  // Bind the state to the initial database value
  const [color, setColor] = useState(defaultValue);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Visual Swatch Input */}
      <input 
        type="color" 
        value={color}
        onChange={handleColorChange}
        className="w-10 h-10 p-1 bg-white border border-zinc-300 rounded cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-900" 
      />
      
      {/* Precision Text Input (This is what actually submits via the 'name' attribute) */}
      <div className="relative flex-1">
        <input 
          type="text" 
          name={name}
          value={color}
          onChange={handleColorChange}
          maxLength={7}
          pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
          title="Must be a valid hex code (e.g., #FFFFFF)"
          className="w-full pl-4 pr-4 py-2 bg-white border border-zinc-200 rounded-md text-sm font-mono text-zinc-700 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-zinc-900" 
          placeholder="#FFFFFF"
        />
      </div>
    </div>
  );
}