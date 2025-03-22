import { writable } from 'svelte/store';

// Base storage key for localStorage - will be combined with workflow name
// This creates a unique identifier for each workflow to prevent collision
const BASE_STORAGE_KEY = 'runpod_state';

// Default state
// This defines the initial structure of the store and matches what components like DeforumRun.svelte send
// - service: Identifies which service generated the data (e.g., "deforum", "comfyui")
// - workflow_name: The specific workflow that was executed
// - statusFields: Formatted status information for display in the UI
// - logs: Collection of log messages from the job execution
// - status: Current user-friendly status of the job
// - runpodStatus: Complete RunPod API response data with detailed job information
// - images: Generated images from the job
// - values: Store input field values
// - connectedBatches: Added this field for image lineage tracking
const defaultState = {
    service: null,
    workflow_name: null,
    statusFields: [],
    logs: [],
    status: 'Idle',
    runpodStatus: null,
    images: [],
    values: {},
    connectedBatches: []
};

// Check if we're running in a browser environment
// This is used to ensure that the store only runs in the browser
// This is important because the store is used in both the client and server
// If the store is used in the server, it will throw an error
const isBrowser = typeof window !== 'undefined';

// Helper function to get the storage key for a specific workflow
// If workflow_name is provided, it creates a workflow-specific key
// Otherwise, it falls back to the base key for backward compatibility
const getStorageKey = (workflow_name) => {
    if (workflow_name) {
        return `${BASE_STORAGE_KEY}_${workflow_name}`;
    }
    return BASE_STORAGE_KEY;
};

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
        // Clean up any old generic key if it exists
        // This is a one-time cleanup of the old storage format
        const oldGenericState = localStorage.getItem(BASE_STORAGE_KEY);
        if (oldGenericState) {
            try {
                // Try to parse the old state
                const oldState = JSON.parse(oldGenericState);
                // If it has a workflow_name, migrate it to the workflow-specific key
                if (oldState.workflow_name) {
                    const workflowKey = getStorageKey(oldState.workflow_name);
                    localStorage.setItem(workflowKey, oldGenericState);
                }
            } catch (e) {
                console.warn('Error parsing old state during cleanup:', e);
            }
            // Remove the old generic key
            localStorage.removeItem(BASE_STORAGE_KEY);
        }
    } catch (error) {
        console.warn('Error during old state cleanup:', error);
    }
    
    // Return default state - specific workflow states will be loaded by components
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
    if (!isBrowser || !state) return;
    
    try {
        // Only save state if we have a workflow name
        if (state.workflow_name) {
            // Get the workflow-specific storage key
            const storageKey = getStorageKey(state.workflow_name);
            
            // Convert the state object to a JSON string so it can be stored in localStorage
            const stateJson = JSON.stringify(state);
            
            // Save the JSON string to localStorage using our workflow-specific key only
            localStorage.setItem(storageKey, stateJson);
        }
    } catch (error) {
        console.error('Error saving state to localStorage:', error);
    }
});

// Load state for a specific workflow
// This function allows components to load saved state for a particular workflow
// It's useful when switching between workflows to restore the previous settings
export function loadWorkflowState(workflow_name) {
    if (!isBrowser || !workflow_name) return defaultState;
    
    try {
        const storageKey = getStorageKey(workflow_name);
        const savedState = localStorage.getItem(storageKey);
        
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            runState.set(parsedState);
            return parsedState;
        }
    } catch (error) {
        console.error(`Error loading state for workflow ${workflow_name}:`, error);
    }
    
    // If no saved state exists for this workflow, return a new state with this workflow name
    const newState = { ...defaultState, workflow_name };
    runState.set(newState);
    return newState;
}

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
export function resetRunState(workflow_name = null) {
    // Reset the store to its default state
    runState.set(defaultState);
    
    // Then, if we're in a browser environment, also clear localStorage
    if (isBrowser) {
        try {
            if (workflow_name) {
                // If a workflow name is provided, only clear that workflow's storage
                const storageKey = getStorageKey(workflow_name);
                localStorage.removeItem(storageKey);
            } else {
                // Otherwise, clear all runpod state storage
                // First, get all keys from localStorage
                const keys = Object.keys(localStorage);
                
                // Then, remove any keys that start with our base storage key
                keys.forEach(key => {
                    if (key === BASE_STORAGE_KEY || key.startsWith(`${BASE_STORAGE_KEY}_`)) {
                        localStorage.removeItem(key);
                    }
                });
            }
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }
}