"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  // Await the cookies object (Next.js 15 standard) and destroy the session cookie.
  // NOTE: If your cookie is named something else (e.g., 'auth_token'), change it here!
  const cookieStore = await cookies();
  cookieStore.delete('admin_session'); 
  
  // Instantly boot the user back to the login screen
  redirect('/login');
}