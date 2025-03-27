<script lang="ts">
    import { afterUpdate } from 'svelte';
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

    // Subscribe to runState
    $: {
        if ($runState) {
            logs = $runState.logs || [];
            status = $runState.status || '';
            runpodStatus = $runState.runpodStatus || null;
        }
    }

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
</script>

{#if logs.length > 0}
    <div class="mt-4 w-full">
        <div class="text-gray-500 p-2 text-sm overflow-hidden h-8 flex items-center justify-center">
            {#if logs[logs.length - 1]}
                {#if logs[logs.length - 1].type === 'worker'}
                    <span class="text-gray-500 truncate text-center">
                        {logs[logs.length - 1].message}
                    </span>
                {:else if logs[logs.length - 1].type === 'error'}
                    <span class="text-red-500 truncate text-center">
                        Error: {logs[logs.length - 1].message}
                    </span>
                {:else}
                    <span class="text-gray-500 truncate text-center">
                        {logs[logs.length - 1].message}
                    </span>
                {/if}
            {/if}
            
            {#if status !== 'Completed' && status !== 'Error'}
                <span class="animate-pulse ml-1 text-gray-500">▋</span>
            {/if}
        </div>
    </div>
{/if} 