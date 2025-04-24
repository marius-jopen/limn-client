<script>
    let prompt = '';
    let response = '';
    let isLoading = false;
    let error = '';
    let selectedModel = 'gpt-3.5-turbo';

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

    const models = [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', limits: '200,000 TPM, 500 RPM' },
        { id: 'gpt-4', name: 'GPT-4', limits: '10,000 TPM, 500 RPM' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', limits: '30,000 TPM, 500 RPM' },
        { id: 'gpt-4o', name: 'GPT-4o', limits: '30,000 TPM, 500 RPM' }
    ];

    async function handleSubmit() {
        isLoading = true;
        error = '';
        response = '';

        const requestBody = {
            input: {
                prompt: prompt,
                model: selectedModel
            }
        };

        console.log('Sending request to:', `${serverUrl}/openai-runpod-serverless-run`);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

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

            console.log('Response status:', res.status);
            const responseText = await res.text();
            console.log('Response text:', responseText);

            if (!res.ok) {
                throw new Error(`Server error: ${res.status} ${res.statusText}\n${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Failed to parse response as JSON: ${responseText}`);
            }

            if (!data.data || !data.data.choices || !data.data.choices[0]) {
                console.error('Invalid response structure:', data);
                throw new Error('Invalid response format from server');
            }

            response = data.data.choices[0].message.content;
        } catch (e) {
            error = `Error: ${e.message}`;
            console.error('Error details:', e);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="container">
    <h2>OpenAI Chat</h2>
    
    <div class="input-section">
        <div class="model-selector">
            <label for="model">Model:</label>
            <select 
                id="model" 
                bind:value={selectedModel}
                disabled={isLoading}
            >
                {#each models as model}
                    <option value={model.id}>
                        {model.name} ({model.limits})
                    </option>
                {/each}
            </select>
        </div>

        <textarea
            bind:value={prompt}
            placeholder="Enter your prompt here..."
            rows="4"
            disabled={isLoading}
        />
        <button 
            on:click={handleSubmit} 
            disabled={isLoading || !prompt.trim()}
        >
            {isLoading ? 'Sending...' : 'Send'}
        </button>
    </div>

    {#if error}
        <div class="error">
            {error}
        </div>
    {/if}

    {#if response}
        <div class="output-section">
            <h3>Response:</h3>
            <div class="response">
                {response}
            </div>
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .input-section {
        margin-bottom: 20px;
    }

    .model-selector {
        margin-bottom: 15px;
    }

    .model-selector label {
        margin-right: 10px;
    }

    .model-selector select {
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ccc;
        min-width: 300px;
    }

    textarea {
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
    }

    button {
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .error {
        color: red;
        margin: 10px 0;
        padding: 10px;
        background-color: #ffe6e6;
        border-radius: 4px;
        white-space: pre-wrap;
    }

    .output-section {
        margin-top: 20px;
    }

    .response {
        padding: 15px;
        background-color: #f8f9fa;
        border-radius: 4px;
        white-space: pre-wrap;
    }
</style>