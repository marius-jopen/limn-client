<script>
    import { createEventDispatcher } from 'svelte';
    import PreviewImage from '$lib/controls/deforumPreviewImage.svelte';

    let maxFrames = 50;
    let globalPositivePrompt = 'masterpiece, hyperdetailed';
    let globalNegativePrompt = 'bad eyes';
    
    let promptEntries = {
        "0": "house",
        "10": "computer",
        "20": "coconut",
        "30": "cat",
        "40": "spaceship"
    };

    let promptEntriesList = Object.entries(promptEntries).map(([key, value]) => ({
        frame: Number(key),
        basePrompt: value,
        negativePrompt: ''
    }));

    const dispatch = createEventDispatcher();

    function updatePromptEntry(key, promptValue, negativeValue) {
        const entry = promptEntriesList.find((item) => item.frame === key);
        if (entry) {
            entry.basePrompt = promptValue;
            entry.negativePrompt = negativeValue;

            const fullPrompt = buildFullPrompt(entry.basePrompt, entry.negativePrompt);
            promptEntries[key] = fullPrompt;
            dispatch('update', { maxFrames, promptEntries });
        }
    }

    function buildFullPrompt(basePrompt, negativePrompt) {
        const globalPrompt = globalPositivePrompt ? `${globalPositivePrompt}, ` : '';
        
        let negativePart = '';
        if (negativePrompt || globalNegativePrompt) {
            negativePart = ` --neg ${negativePrompt || ''}${negativePrompt && globalNegativePrompt ? ' ' : ''}${globalNegativePrompt || ''}`;
        }

        return `${globalPrompt}${basePrompt}${negativePart}`;
    }

    function updateMaxFrames(event) {
        maxFrames = event.target.value;
        dispatch('update', { maxFrames, promptEntries });
    }

    function addNewPromptEntry(index) {
        const previousFrame = promptEntriesList[index].frame;
        const nextFrame = promptEntriesList[index + 1]?.frame;

        let newFrame;
        if (nextFrame !== undefined) {
            newFrame = Math.floor((previousFrame + nextFrame) / 2);
        } else {
            newFrame = previousFrame + 1;
        }

        const newItem = {
            frame: newFrame,
            basePrompt: '',
            negativePrompt: ''
        };
        promptEntries[newFrame] = '';
        promptEntriesList = [
            ...promptEntriesList.slice(0, index + 1),
            newItem,
            ...promptEntriesList.slice(index + 1),
        ];
        dispatch('update', { maxFrames, promptEntries });
    }

    function deletePromptEntry(key) {
        delete promptEntries[key];
        promptEntriesList = promptEntriesList.filter((item) => item.frame !== key);
        dispatch('update', { maxFrames, promptEntries });
    }

    function autofillFrames() {
        const itemCount = promptEntriesList.length;
        if (itemCount > 0) {
            const interval = Math.floor(maxFrames / itemCount);

            const updatedPromptEntries = {};
            promptEntriesList = promptEntriesList.map((item, index) => {
                const newFrame = interval * index;
                updatedPromptEntries[newFrame] = buildFullPrompt(item.basePrompt, item.negativePrompt);
                return { ...item, frame: newFrame };
            });

            promptEntries = updatedPromptEntries;
            dispatch('update', { maxFrames, promptEntries });
        }
    }

    function updateGlobalPrompts() {
        promptEntriesList.forEach(({ frame, basePrompt, negativePrompt }) => {
            const fullPrompt = buildFullPrompt(basePrompt, negativePrompt);
            promptEntries[frame] = fullPrompt;
        });
        dispatch('update', { maxFrames, promptEntries });
    }
</script>

<main>
    <div>
        <div class="mt-2">
            <label for="globalPositivePrompt">Global Positive Prompt:</label>
            <input class="text-input w-96" id="globalPositivePrompt" type="text" bind:value={globalPositivePrompt} on:input={updateGlobalPrompts} />
        </div>

        <div class="mt-2">
            <label for="globalNegativePrompt">Global Negative Prompt:</label>
            <input class="text-input w-96" id="globalNegativePrompt" type="text" bind:value={globalNegativePrompt} on:input={updateGlobalPrompts} />
        </div>

    </div>

    <div class="pt-4">
        <h3 class="pb-2">Prompts</h3>
        {#each promptEntriesList as { frame, basePrompt, negativePrompt }, index}
            <div class="py-1 flex gap-1">
                <div class="flex">
                    <button class="button" on:click={() => deletePromptEntry(frame)}>-</button>
                    <button class="button" on:click={() => addNewPromptEntry(index)}>+</button>
                </div>

                <div>
                    <label for={"frame_" + frame}>Frame:</label>
                    <input
                        class="text-input w-24"
                        id={"frame_" + frame}
                        type="number"
                        value={frame}
                        readonly
                    />
                </div>

                <div>
                    <label for={"prompt_" + frame}>Positive:</label>
                    <input
                        class="text-input w-96"
                        id={"prompt_" + frame}
                        type="text"
                        bind:value={basePrompt}
                        on:input={(e) => updatePromptEntry(frame, e.target.value, negativePrompt)}
                    />
                </div>

                <div>
                    <label for={"negative_" + frame}>Negative:</label>
                    <input
                        class="text-input w-40"
                        id={"negative_" + frame}
                        type="text"
                        bind:value={negativePrompt}
                        on:input={(e) => updatePromptEntry(frame, basePrompt, e.target.value)}
                    />
                </div>

                <!-- Include the PreviewImage component -->
                <PreviewImage 
                    {basePrompt} 
                    {negativePrompt} 
                    {globalPositivePrompt} 
                    {globalNegativePrompt} 
                />
            </div>
        {/each}
    </div>

    <div>
        <label for="maxFrames">Max Frames:</label>
        <input class="text-input w-24" id="maxFrames" type="number" bind:value={maxFrames} on:input={updateMaxFrames} />
        
        <button class="button mt-2" on:click={autofillFrames}>Autofill Frames</button>
    </div>
</main>

<style>
    .text-input {
        margin-right: 8px;
    }

    .button {
        margin-right: 8px;
    }
</style>
