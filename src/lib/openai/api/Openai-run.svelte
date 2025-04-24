<script>
    import { createEventDispatcher } from 'svelte';
    import Button from '$lib/atoms/Button.svelte';
    const dispatch = createEventDispatcher();

    export let prompt = '';
    export let disabled = false;
    export let isLoading = false;
    export let hideTextarea = false;
    export let buttonLabel = 'Generate Prompt';
    export let trigger = 0;

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

    async function handleSubmit() {
        if (disabled || isLoading) return;
        
        isLoading = true;
        dispatch('error', '');

        const requestBody = {
            input: {
                prompt: prompt,
                model: 'gpt-3.5-turbo'
            }
        };

        try {
            const res = await fetch(`${serverUrl}/openai-runpod-serverless-run`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'user-id': 'default_user',
                    'service': 'openai',
                    'workflow': 'chat'
                },
                body: JSON.stringify(requestBody)
            });

            if (!res.ok) {
                throw new Error(`Server error: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();

            if (!data.data || !data.data.choices || !data.data.choices[0]) {
                throw new Error('Invalid response format from server');
            }

            const response = data.data.choices[0].message.content;
            dispatch('response', response);
        } catch (e) {
            dispatch('error', e.message);
            console.error('Error details:', e);
        } finally {
            isLoading = false;
        }
    }

    $: if (prompt) {
        dispatch('input', prompt);
    }

    $: if (trigger > 0) {
        handleSubmit();
    }
</script>

{#if !hideTextarea}
    <textarea
        bind:value={prompt}
        placeholder="Ask anything..."
        rows="4"
        disabled={disabled || isLoading}
    />
{/if}
<div class="button-container">
    <Button 
        onClick={handleSubmit}
        disabled={disabled || isLoading || !prompt.trim()}
        variant="primary"
        size="sm"
        label={isLoading ? 'Sending...' : buttonLabel}
    />
</div>

<slot />