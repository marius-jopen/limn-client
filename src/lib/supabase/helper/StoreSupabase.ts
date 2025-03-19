import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

// Create a writable store for the user
export const user = writable<User | null>(null);

// Create a writable store for the selected image ID
export const selectedImageId = writable<string | null>(null);

// Initialize the store with the current session
export const initializeAuth = async (supabase: any) => {
    // Get the initial session
    const { data: { session } } = await supabase.auth.getSession();
    user.set(session?.user ?? null);

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event: string, session: any) => {
        user.set(session?.user ?? null);
    });
}; 