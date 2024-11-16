<script>
    import Header from '$lib/layout/header.svelte';
    import { deforumDefaultParams } from '$lib/parameters/deforumParameters';
    import { getCurrentTimestamp } from '$lib/helpers/getCurrentTimestamp';
    import DeforumControl from '$lib/controls/deforumControl.svelte';
    import { generateVideo } from '$lib/api/videoGeneration.js'; 

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
            await generateVideo('generate-deforum-1111-runpod-pod', videoRequest);
        } catch (error) {
            console.error('Failed to generate video. Please check the server logs for more details.');
        }
    }

</script>

<main>
    <Header text="Generate Video with Deforum on RunPod Pod" />

    <button class="mt-4 button" on:click={handleGenerateVideo}>Generate Video</button>
    
    <DeforumControl on:update={handleUpdate} />
</main>
