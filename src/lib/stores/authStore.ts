/**
 * Authentication Store
 * 
 * This store manages the authentication state of the application using Svelte's writable store.
 * It maintains three pieces of state:
 * - isAuthenticated: boolean flag indicating if user is logged in
 * - user: stores user data when authenticated
 * - session: stores current session information
 */

import { writable } from 'svelte/store'

export const authStore = writable({
    isAuthenticated: false,
    user: null,
    session: null
}) 