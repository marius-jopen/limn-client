<script>
    import { afterUpdate } from 'svelte';
    
    export let logs = [];
    export let status = '';
    export let runpodStatus = null;

    let logContainer; // Reference to the log container element

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
    <div class="mt-4">
        <h4 class="font-semibold mb-2">
            Generation Logs:
        </h4>
        
        <div 
            bind:this={logContainer}
            class="log-container bg-black text-green-400 p-4 rounded shadow-sm font-mono text-sm overflow-y-auto max-h-60"
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