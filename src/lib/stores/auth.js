/**
 * Authentication Store
 * 
 * This file manages the user authentication state using Svelte stores and Supabase auth.
 * It provides:
 * - A writable store that holds the current user state
 * - Initialization of the user state from an existing session
 * - Real-time updates to the user state when auth changes occur
 * 
 * The store is only initialized on the browser side (not during SSR) using the browser check.
 */

import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase/supabaseClient';
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