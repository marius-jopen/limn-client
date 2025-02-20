import { writable } from 'svelte/store';

export const runState = writable({
    statusFields: [],
    logs: [],
    status: 'Idle',
    runpodStatus: null,
    images: []
}); 