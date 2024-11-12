<script>
    import { deforumDefaultParams } from '../../lib/deforumParameters';
    import { getCurrentTimestamp } from '../../lib/helper.js';
    import DeforumControl from '../../lib/deforumControl.svelte';
    import { generateVideo } from '../../lib/api.js';  // Import the generateVideo function

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

    async function handleGenerateVideo() {
        let videoRequest = {
            ...deforumDefaultParams,
            max_frames: parseInt(maxFrames, 10),  // Ensure max_frames is an integer
            prompts: promptEntries,
            batch_name: "Deforum_" + getCurrentTimestamp(),
        };

        console.log("Generated Video Request:", videoRequest);
        console.log("Prompts:", videoRequest.prompts);

        try {
            await generateVideo(videoRequest);  // Use the generateVideo function from api.js
        } catch (error) {
            console.error('Failed to generate video. Please check the server logs for more details.');
        }
    }

</script>

<main>
    <h1 class="pb-4">Generate Video with Deforum on RunPod Pod</h1>

    <button class="mt-4 button" on:click={handleGenerateVideo}>Generate Video</button>
    
    <DeforumControl on:update={handleUpdate} />
</main>
