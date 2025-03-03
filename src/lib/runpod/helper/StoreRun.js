import { writable } from 'svelte/store';

const STORAGE_KEY = 'runpod_state';
const OLD_STORAGE_KEY = 'limn_run_state';

// Load initial state from localStorage or use default
const loadState = () => {
    if (typeof window === 'undefined') return null;
    
    try {
        // Try to load from new key first
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            return JSON.parse(savedState);
        }
        
        // If not found, try to load from old key and migrate
        const oldState = localStorage.getItem(OLD_STORAGE_KEY);
        if (oldState) {
            const parsedOldState = JSON.parse(oldState);
            // Save to new key
            localStorage.setItem(STORAGE_KEY, oldState);
            // Clean up old key
            localStorage.removeItem(OLD_STORAGE_KEY);
            return parsedOldState;
        }
    } catch (error) {
        console.error('Error loading state from localStorage:', error);
    }
    return null;
};

// Default state
const defaultState = {
    statusFields: [],
    logs: [],
    status: 'Idle',
    runpodStatus: null,
    images: []
};

// Create the store with initial state from localStorage or default
export const runState = writable(loadState() || defaultState);

// Subscribe to changes and save to localStorage
if (typeof window !== 'undefined') {
    runState.subscribe(state => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            // Clean up old key if it exists
            localStorage.removeItem(OLD_STORAGE_KEY);
        } catch (error) {
            console.error('Error saving state to localStorage:', error);
        }
    });
}

// Helper function to reset the store to default state
export function resetRunState() {
    runState.set(defaultState);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(OLD_STORAGE_KEY);
    }
}

// Helper function to clear all runpod related storage
export function clearAllRunpodStorage() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(OLD_STORAGE_KEY);
        runState.set(defaultState);
    }
} 