"use client";

import { LogOut } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { logoutAction } from '@/app/(admin)/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50 group"
    >
      <LogOut size={18} className={`group-hover:scale-110 transition-transform ${pending ? 'animate-pulse' : ''}`} />
      <span>{pending ? 'Terminating...' : 'Secure Log Out'}</span>
    </button>
  );
}

export default function LogoutButton() {
  return (
    <form action={logoutAction} className="w-full mt-2">
      <SubmitButton />
    </form>
  );
}