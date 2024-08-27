<script>
    import { createEventDispatcher } from 'svelte';

    let maxFrames = 50;
    let promptEntries = {
        "0": "house",
        "10": "computer",
        "20": "coconut",
        "30": "cat",
        "40": "spaceship"
    };

    let promptEntriesList = Object.entries(promptEntries).map(([key, value]) => ({
        frame: Number(key),
        prompt: value,
        negativePrompt: ''
    }));

    const dispatch = createEventDispatcher();

    function updatePromptEntry(key, promptValue, negativeValue) {
        const entry = promptEntriesList.find((item) => item.frame === key);
        if (entry) {
            entry.prompt = `${promptValue}${negativeValue ? ` --neg ${negativeValue}` : ''}`;
            promptEntries[key] = entry.prompt;
            dispatch('update', { maxFrames, promptEntries });
        }
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
            prompt: '',
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

    function updateFrameNumber(oldKey, newKey) {
        if (newKey !== oldKey && newKey !== '') {
            promptEntries[newKey] = promptEntries[oldKey];
            delete promptEntries[oldKey];

            const entry = promptEntriesList.find((item) => item.frame === oldKey);
            if (entry) {
                entry.frame = newKey;
            }

            dispatch('update', { maxFrames, promptEntries });
        }
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
                updatedPromptEntries[newFrame] = item.prompt;
                return { ...item, frame: newFrame };
            });

            promptEntries = updatedPromptEntries;
            dispatch('update', { maxFrames, promptEntries });
        }
    }
</script>

<main>
    <div>
        <label for="maxFrames">Max Frames:</label>
        <input class="text-input" id="maxFrames" type="number" bind:value={maxFrames} on:input={updateMaxFrames} />
        <button class="button" on:click={autofillFrames}>Autofill Frames</button>
    </div>

    <div class="pt-4">
        <h3 class="pb-2">Prompt Entries</h3>
        {#each promptEntriesList as { frame, prompt, negativePrompt }, index}
            <div>
                <label for={"frame_" + frame}>Frame:</label>
                <input
                    class="text-input"
                    id={"frame_" + frame}
                    type="number"
                    value={frame}
                    readonly
                />
                <label for={"prompt_" + frame}>Prompt:</label>
                <input
                    class="text-input"
                    id={"prompt_" + frame}
                    type="text"
                    value={prompt.includes(' --neg ') ? prompt.split(' --neg ')[0] : prompt}
                    on:input={(e) => updatePromptEntry(frame, e.target.value, negativePrompt)}
                />
                <label for={"negative_" + frame}>Negative Prompt:</label>
                <input
                    class="text-input"
                    id={"negative_" + frame}
                    type="text"
                    bind:value={negativePrompt}
                    on:input={(e) => updatePromptEntry(frame, prompt.includes(' --neg ') ? prompt.split(' --neg ')[0] : prompt, e.target.value)}
                />
                <button class="button" on:click={() => deletePromptEntry(frame)}>-</button>
                <button class="button" on:click={() => addNewPromptEntry(index)}>+</button>
            </div>
        {/each}
    </div>
</main>
