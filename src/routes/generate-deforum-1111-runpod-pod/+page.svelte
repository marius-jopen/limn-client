<script>
    import { API_URLS } from '../../lib/config';
    import { deforumDefaultParams } from '../../lib/deforumParameters';
    import { getCurrentTimestamp } from '../../lib/helper.js';
    import DeforumPrompts from '../../lib/deforumPrompts.svelte';

    // Initialize variables with default values
    let maxFrames = 50;
    let promptEntries = {
        "0": "house",
        "10": "computer",
        "20": "coconut",
        "30": "cat",
        "40": "spaceship"
    };

    function handleUpdate(event) {
        maxFrames = event.detail.maxFrames;
        promptEntries = event.detail.promptEntries;
    }

    async function generateVideo() {
        let imageRequest = {
            ...deforumDefaultParams,
            max_frames: maxFrames,
            prompts: promptEntries,
            batch_name: "Deforum_" + getCurrentTimestamp(),
        };

        console.log("Generated Image Request:", imageRequest);
        console.log("Prompts:", imageRequest.prompts);

        try {
            const response = await fetch(API_URLS.server + "/generate-deforum-1111-runpod-pod", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(imageRequest)
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            console.log('Image generation request sent successfully.');
        } catch (error) {
            console.error('Error generating image:', error);
            console.log('Failed to generate image. Please check the server logs for more details.');
        }
    }
</script>

<main>
    <h1 class="pb-4">Generate Video with Deforum on RunPod Pod</h1>

    <!-- DeforumPrompts component is correctly bound to update the main component's state -->
    <DeforumPrompts on:update={handleUpdate} />

    <button class="mt-4 button" on:click={generateVideo}>Generate</button>
</main>
