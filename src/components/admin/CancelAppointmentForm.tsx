"use client";

export default function CancelAppointmentForm({ 
  appointmentId, 
  action 
}: { 
  appointmentId: string, 
  action: (formData: FormData) => void 
}) {
  return (
    <form 
      action={action} 
      className="inline-block" 
      onSubmit={(e) => { 
        if(!confirm('Cancel this appointment? This opens the slot back up for the public.')) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <input type="hidden" name="status" value="Cancelled" />
      <button 
        type="submit" 
        className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}