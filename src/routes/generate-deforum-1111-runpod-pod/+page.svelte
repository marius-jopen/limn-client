<script>
    import { API_URLS } from '../../lib/config';
    import { deforumDefaultParams } from '../../lib/deforumConfig.js';

    let maxFrames = 50;
    let promptEntries = {
        "0": "tiny cute zombie, vibrant diffraction, highly detailed, intricate, ultra hd, sharp photo, crepuscular rays, in focus",
        "10": "anthropomorphic clean cat, surrounded by fractals, epic angle and pose, symmetrical, 3d, depth of field",
        "20": "a beautiful coconut",
        "30": "a beautiful durian, award winning photography"
    };

    function addPrompt() {
        const newFrame = (Object.keys(promptEntries).length * Math.floor(maxFrames / (Object.keys(promptEntries).length + 1))).toString();
        promptEntries = { ...promptEntries, [newFrame]: "" };
        updatePromptFrames();  // Recalculate frames after adding a new prompt
    }

    function removePrompt(frame) {
        const { [frame]: _, ...rest } = promptEntries;
        promptEntries = rest;
        updatePromptFrames();  // Recalculate frames after removing a prompt
    }

    function updatePromptFrames() {
        let updatedEntries = {};
        const interval = Math.floor(maxFrames / Object.keys(promptEntries).length);

        Object.values(promptEntries).forEach((text, index) => {
            const frame = (index * interval).toString();
            updatedEntries[frame] = text;
        });

        promptEntries = updatedEntries;
    }

    function updatePromptsInRequest() {
        let prompts = {};

        Object.entries(promptEntries).forEach(([frame, text]) => {
            prompts[frame] = text.trim();
        });

        return prompts;
    }

    $: updatedPromptEntries = updatePromptsInRequest();

    async function generateVideo() {
        let imageRequest = {
            ...deforumDefaultParams,
            max_frames: maxFrames,
            prompts: updatedPromptEntries,
            batch_name: "Deforum_" + getCurrentTimestamp(),
        };

        console.log("Generated Image Request:", imageRequest);

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

            alert('Image generation request sent successfully.');
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image. Please check the server logs for more details.');
        }
    }

    function getCurrentTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}${month}${day}_${hours}${minutes}${seconds}`;
    }

    // Recalculate frames whenever maxFrames changes
    $: updatePromptFrames();
</script>

<main>
    <h1 class="pb-4">Generate Video with Deforum on RunPod Pod</h1>

    <!-- Max Frames Input -->
    <div class="pb-4">
        <label for="maxFrames">Max Frames:</label>
        <input
            id="maxFrames"
            class="text-input"
            type="number"
            bind:value={maxFrames}
            min="1"
        />
    </div>

    <!-- Prompts List -->
    <div class="pb-4">
        {#each Object.entries(promptEntries) as [frame, text], index}
            <div class="prompt-input">
                <label for={`prompt-${index}`}>Frame {frame}:</label>
                <input
                    id={`prompt-${index}`}
                    class="text-input"
                    type="text"
                    bind:value={promptEntries[frame]}
                    placeholder="Enter your prompt"
                />
                <button class="button" on:click={() => removePrompt(frame)}>Delete</button>
            </div>
        {/each}
    </div>

    <button class="button" on:click={addPrompt}>Add Prompt</button>
    <button class="button" on:click={generateVideo}>Generate</button>
</main>
