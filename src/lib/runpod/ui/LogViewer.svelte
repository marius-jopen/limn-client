<script lang="ts">
    import { afterUpdate } from 'svelte';
    import Label from '$lib/atoms/Label.svelte';
    
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
    export let logs: LogEntry[] = [];
    export let status: string = '';
    export let runpodStatus: RunpodStatus | null = null;

    let logContainer: HTMLDivElement; // Reference to the log container element

    // Auto-scroll to bottom whenever logs update
    afterUpdate(() => {
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
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
</script>

{#if logs.length > 0}
    <div class="mt-4 w-full">
        <Label for_id={id} {label} />
        
        <div 
            bind:this={logContainer}
            class="log-container bg-black text-green-400 p-4 font-mono text-sm overflow-y-auto max-h-60"
        >
            {#if runpodStatus?.endpointId}
                <div class="text-blue-400 mb-2">Endpoint ID: {runpodStatus.endpointId}</div>
            {/if}

            {#if runpodStatus?.workerId}
                <div class="text-blue-400 mb-2">Worker ID: {runpodStatus.workerId}</div>
            {/if}

            {#each logs as log}
                {#if log.type === 'worker'}
                    <div class="text-yellow-400 whitespace-pre-wrap leading-relaxed">
                        [{formatTimestamp(log.timestamp)}] [{log.level}] 

                        <span class="text-white">
                            {formatProgressBar(log.message)}
                        </span>
                    </div>
                {:else if log.type === 'error'}
                    <div class="text-red-400 whitespace-pre-wrap leading-relaxed">
                        Error: {log.message}
                    </div>
                {:else}
                    <div class="text-green-400 whitespace-pre-wrap leading-relaxed">
                        {log.message}
                    </div>
                {/if}
            {/each}

            {#if status !== 'Completed' && status !== 'Error'}
                <div class="animate-pulse">
                    ▋
                </div>
            {/if}
        </div>
    </div>
{/if} 