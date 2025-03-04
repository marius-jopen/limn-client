import { writable } from 'svelte/store';

// Storage key for localStorage - unique identifier to prevent collision with other stores
// This key is used to save and retrieve RunPod state data in the browser's localStorage
// Each store in the application should use a different key to avoid overwriting each other's data
const STORAGE_KEY = 'runpod_state';


// Default state
// This defines the initial structure of the store and matches what components like DeforumRun.svelte send
// - service: Identifies which service generated the data (e.g., "deforum", "comfyui")
// - workflow_name: The specific workflow that was executed
// - statusFields: Formatted status information for display in the UI
// - logs: Collection of log messages from the job execution
// - status: Current user-friendly status of the job
// - runpodStatus: Complete RunPod API response data with detailed job information
// - images: Generated images from the job
const defaultState = {
    service: null,
    workflow_name: null,
    statusFields: [],
    logs: [],
    status: 'Idle',
    runpodStatus: null,
    images: []
};

// Check if we're running in a browser environment
// This is used to ensure that the store only runs in the browser
// This is important because the store is used in both the client and server
// If the store is used in the server, it will throw an error
const isBrowser = typeof window !== 'undefined';

// Load initial state from localStorage or use default
// This function is called when the store is first created to initialize its state
// It tries to load previously saved state from localStorage, or falls back to defaultState if:
// - We're not in a browser environment (SSR/server-side)
// - No saved state exists in localStorage
// - There's an error reading or parsing the saved state
const loadState = () => {
    
    // If we're not in a browser (e.g., running on server during SSR),
    // we can't access localStorage, so return the default state immediately
    if (!isBrowser) return defaultState;
    
    try {
        // Attempt to retrieve the saved state from localStorage using our unique key
        const savedState = localStorage.getItem(STORAGE_KEY);
        
        // If we found saved state in localStorage, parse the JSON string back into an object
        // This restores our previous RunPod state (job status, images, logs, etc.)
        if (savedState) {
            return JSON.parse(savedState);
        }
    } catch (error) {
        // Handle any errors that might occur:
        // - localStorage might be disabled or full
        // - The saved state might be invalid JSON
        // - There might be permission issues
        console.error('Error loading state from localStorage:', error);
    }
    
    // If we couldn't load state from localStorage (not found or error),
    // return the default state as a fallback
    return defaultState;
};

// Create the store with initial state from localStorage or default
// This creates a Svelte writable store named 'runState' that components can subscribe to
// The store is initialized with either:
//   1. The previously saved state from localStorage (if it exists)
//   2. The default state (if no saved state exists or we're in SSR)
// This ensures that the store starts with the most recent state when the app loads
// Components like DeforumRun.svelte will import and use this store to:
//   - Read the current RunPod state (using $runState)
//   - Update the state (using runState.set() or runState.update())
//   - React to state changes (by subscribing to the store)
// So when the variable runstate is used in a component, it will automatically update when the state changes
// And the component can read but also write to the store
export const runState = writable(loadState());

// The complete data flow in this store system:
//
// 1. READING (localStorage → store): 
//    - loadState() reads from localStorage when the app starts
//    - This initializes the store with previously saved data
//
// 2. WRITING (store → localStorage):
//    - The subscription below writes to localStorage when the store changes
//    - This ensures any updates are persisted automatically
//
// This bidirectional flow creates a complete persistence cycle:
// Components read from and write to the store, while the store reads from and writes to localStorage

// The subscribe method takes a callback function that runs on every state change,
// similar to how addEventListener runs a callback on every event
runState.subscribe(state => {
    try {
        // Convert the state object to a JSON string so it can be stored in localStorage
        // localStorage can only store strings, not complex objects
        const stateJson = JSON.stringify(state);
        
        // Save the JSON string to localStorage using our unique key
        // This overwrites any previous state saved with the same key
        localStorage.setItem(STORAGE_KEY, stateJson);
    } catch (error) {
        // Handle potential errors:
        // - localStorage might be disabled in the browser
        // - The quota might be exceeded if the state is very large
        // - The state might contain circular references that can't be stringified
        console.error('Error saving state to localStorage:', error);
    }
});

// Reset the store to default state and clear storage
//
// This function performs a complete reset of the RunPod state:
// 1. It sets the store back to its default/initial values
// 2. It removes the saved state from localStorage
// 
// This is useful in scenarios like:
// - When a user wants to start fresh with no previous job data
// - After completing a workflow and wanting to clear previous results
// - When troubleshooting issues by clearing potentially corrupted state
// - When switching between different services or workflows
// 
// Components can import and call this function directly:
// import { resetRunState } from '$lib/runpod/helper/StoreRun.js';
// 
// Example usage in a component:
// function handleReset() {
//   resetRunState();
// }
export function resetRunState() {
    // First, reset the store to its default state
    // This immediately updates all subscribed components with the default values
    // Any component using $runState will see the reset values
    runState.set(defaultState);
    
    // Then, if we're in a browser environment, also clear localStorage
    if (isBrowser) {
        try {
            // Remove the item completely from localStorage
            // This is different from setting it to an empty string
            // It completely removes the key-value pair
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            // Handle potential errors:
            // - localStorage might be disabled
            // - There might be permission issues
            console.error('Error clearing localStorage:', error);
        }
    }
}