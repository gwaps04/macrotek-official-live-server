"use client";

import { useState } from 'react';
import * as Icons from 'lucide-react';

interface TimeSlotManagerProps {
  initialSlots: string[]; // Receives strict 24H arrays like ["09:00", "14:30"]
}

export default function TimeSlotManager({ initialSlots }: TimeSlotManagerProps) {
  const [slots, setSlots] = useState<string[]>(initialSlots);
  const [newTime, setNewTime] = useState<string>('09:00');

  // Convert 24H to 12H just for the visual display on the Chips
  const format12H = (time24: string) => {
    const [h, m] = time24.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const handleAddSlot = () => {
    if (!newTime) return;
    
    // Prevent duplicates
    if (!slots.includes(newTime)) {
      // Add the new time and sort the array chronologically (String sorting works perfectly for 24H time)
      const updatedSlots = [...slots, newTime].sort();
      setSlots(updatedSlots);
    }
  };

  const handleRemoveSlot = (slotToRemove: string) => {
    setSlots(slots.filter(s => s !== slotToRemove));
  };

  return (
    <div className="space-y-4">
      {/* 
        WOZ ARCHITECTURE: The Hidden Input. 
        This quietly converts our React Array back into a comma-separated string 
        so the Server Action (FormData) can easily read it when the admin clicks Save.
      */}
      <input type="hidden" name="timeSlots" value={slots.join(',')} />

      {/* The Input Controls */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 block mb-2">
            Select a Time
          </label>
          <div className="relative">
            {/* The native time input always outputs strict 24H values (HH:mm) internally! */}
            <input 
              type="time" 
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-zinc-900" 
            />
          </div>
        </div>
        <button 
          type="button" 
          onClick={handleAddSlot}
          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <Icons.Plus size={16} /> Add Slot
        </button>
      </div>

      {/* The Display Chips */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 min-h-[100px]">
        {slots.length === 0 ? (
          <div className="text-zinc-400 text-xs text-center pt-4">No time slots configured.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map(time => (
              <div 
                key={time} 
                className="bg-white border border-emerald-200 text-emerald-800 pl-3 pr-1 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                {format12H(time)}
                <button 
                  type="button"
                  onClick={() => handleRemoveSlot(time)}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 text-zinc-400 transition-colors"
                  title="Remove time slot"
                >
                  <Icons.X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-zinc-400 font-medium">Time slots are automatically sorted chronologically.</p>
    </div>
  );
}