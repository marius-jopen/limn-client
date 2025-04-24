<script lang="ts">
    import { afterUpdate, onMount, onDestroy } from 'svelte';
    import Label from '$lib/atoms/Label.svelte';
    import { runState } from '$lib/runpod/helper/StoreRun.js';
    
    interface RunpodStatus {
        endpointId?: string;
        workerId?: string;
    }

    interface LogEntry {
        type: 'worker' | 'error' | 'default';
        timestamp?: number;
        level?: string;
        message: string;
    }

    export let id: string = '';
    export let label: string = '';
    let logs: LogEntry[] = [];
    let status: string = '';
    let runpodStatus: RunpodStatus | null = null;
    let frame = 0;
    let animationInterval: ReturnType<typeof setInterval>;

    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

    // Subscribe to runState
    $: {
        if ($runState) {
            logs = $runState.logs || [];
            status = $runState.status || '';
            runpodStatus = $runState.runpodStatus || null;
            console.log('Current status:', status);
            console.log('Current message:', logs[logs.length - 1]?.message);
        }
    }

    onMount(() => {
        animationInterval = setInterval(() => {
            frame = (frame + 1) % spinnerFrames.length;
        }, 100);
    });

    onDestroy(() => {
        if (animationInterval) {
            clearInterval(animationInterval);
        }
    });

    function formatTimestamp(timestamp) {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString();
    }

    function formatProgressBar(message) {
        // Replace ANSI escape codes and carriage returns with HTML
        return message
            .replace(/\r/g, '\n')
            .replace(/\u001b\[\d+m/g, '');
    }

    function cleanMessage(message: string) {
        // Handle error messages
        if (message.toLowerCase().includes('error')) {
            return message;
        }
        
        // Handle completion messages
        if (message.includes('Job complete') || message.includes('Generation complete')) {
            return 'Generation complete';
        }
        
        // Handle image generation messages
        if (message.includes('Generated new image') || message.includes('Image generated')) {
            return 'Image generated';
        }
        
        // Handle progress messages
        if (message.includes('Progress:') || message.includes('Status:')) {
            return message.split(':')[1]?.trim() || 'Generating...';
        }
        
        // Handle queue messages
        if (message.includes('Queue') || message.includes('Waiting')) {
            return 'Waiting in queue...';
        }
        
        // Default case
        return message;
    }

    function isInProgress(message: string): boolean {
        const normalizedMessage = message.toLowerCase();
        return normalizedMessage.includes('generating') || 
               normalizedMessage.includes('progress') || 
               normalizedMessage.includes('status') ||
               normalizedMessage.includes('processing') ||
               normalizedMessage.includes('in_progress') ||
               normalizedMessage === 'in progress';
    }
</script>

<div class="w-full">
    <div class="text-gray-500 bg-neutral-100 py-[10px] px-4 text-sm overflow-hidden h-[36px] flex items-center justify-center rounded-full">
        {#if logs.length > 0 && logs[logs.length - 1]}
            {#if logs[logs.length - 1].type === 'error'}
                <span class="text-red-500 truncate text-center">
                    Error: {cleanMessage(logs[logs.length - 1].message)}
                </span>
            {:else}
                <span class="text-gray-500 truncate text-center">
                    {#if isInProgress(cleanMessage(logs[logs.length - 1].message))}
                        {spinnerFrames[frame]} {cleanMessage(logs[logs.length - 1].message)}
                    {:else}
                        {cleanMessage(logs[logs.length - 1].message)}
                    {/if}
                </span>
            {/if}
        {:else}
            <span class="text-gray-500 truncate text-center">
                Ready to generate
            </span>
        {/if}
    </div>
</div>