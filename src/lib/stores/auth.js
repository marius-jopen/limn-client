import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { browser } from '$app/environment';

export const user = writable(null);

if (browser) {
    // Initialize the store with the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
        user.set(session?.user ?? null);
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        user.set(session?.user ?? null);
    });
} 