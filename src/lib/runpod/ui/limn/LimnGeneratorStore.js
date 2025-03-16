import { writable } from 'svelte/store';

// Create a writable store with default values
const createGeneratorStore = () => {
  // Default settings
  const defaultSettings = {
    prompt: '',
    aspectRatio: '1:1',
    duration: '5s',
    version: 'basic',
    initImage: null,
    lastUpdated: null
  };
  
  // Create the store with default values
  const { subscribe, set, update } = writable(defaultSettings);
  
  return {
    subscribe,
    
    // Update prompt
    setPrompt: (prompt) => update(state => ({
      ...state,
      prompt,
      lastUpdated: new Date()
    })),
    
    // Update aspect ratio
    setAspectRatio: (aspectRatio) => update(state => ({
      ...state,
      aspectRatio,
      lastUpdated: new Date()
    })),
    
    // Update duration
    setDuration: (duration) => update(state => ({
      ...state,
      duration,
      lastUpdated: new Date()
    })),
    
    // Update version/style
    setVersion: (version) => update(state => ({
      ...state,
      version,
      lastUpdated: new Date()
    })),
    
    // Update initial image
    setInitImage: (initImage) => update(state => ({
      ...state,
      initImage,
      lastUpdated: new Date()
    })),
    
    // Reset to defaults
    reset: () => set(defaultSettings)
  };
};

// Export a singleton instance of the store
export const generatorStore = createGeneratorStore();
