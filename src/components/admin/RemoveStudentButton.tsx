"use client";

import * as Icons from 'lucide-react';

interface RemoveStudentButtonProps {
  enrollmentId: string;
  // WOZ LOGIC: We type the Server Action exactly as it expects to be received
  removeAction: (formData: FormData) => Promise<void>; 
}

export default function RemoveStudentButton({ enrollmentId, removeAction }: RemoveStudentButtonProps) {
  return (
    <form 
      action={removeAction} 
      className="inline-block" 
      onSubmit={(e) => { 
        // Because this file has "use client" at the top, the browser's window.confirm() works perfectly here.
        if(!window.confirm('Are you sure? This will permanently delete the student and free up a seat.')) {
          e.preventDefault();
        } 
      }}
    >
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <button 
        type="submit" 
        className="text-zinc-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors" 
        title="Remove Student"
      >
        <Icons.UserMinus size={16} />
      </button>
    </form>
  );
}