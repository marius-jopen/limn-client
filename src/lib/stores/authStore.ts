import { writable } from 'svelte/store'

export const authStore = writable({
    isAuthenticated: false,
    user: null,
    session: null
}) 