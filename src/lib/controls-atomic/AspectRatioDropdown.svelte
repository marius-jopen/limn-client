<script>
    export let imageDefaultParams;

    const aspectRatios = [
        { label: "1:2", width: 512, height: 1024 },
        { label: "9:16", width: 576, height: 1024 },
        { label: "2:3", width: 683, height: 1024 },
        { label: "3:4", width: 768, height: 1024 },
        { label: "5:6", width: 853, height: 1024 },
        { label: "1:1", width: 1024, height: 1024 },
        { label: "6:5", width: 1024, height: 853 },
        { label: "4:3", width: 1024, height: 768 },
        { label: "3:2", width: 1024, height: 683 },
        { label: "16:9", width: 1024, height: 576 },
        { label: "2:1", width: 1024, height: 512 }
    ];

    // Set default to 1:1 on component initialization
    const defaultRatio = aspectRatios.findIndex(ratio => ratio.label === "1:1");

    // Update initial values
    imageDefaultParams.width = aspectRatios[defaultRatio].width;
    imageDefaultParams.height = aspectRatios[defaultRatio].height;

    function handleAspectRatioChange(event) {
        const selected = aspectRatios[event.target.value];
        imageDefaultParams.width = selected.width;
        imageDefaultParams.height = selected.height;
    }
</script>

<div class="flex flex-col gap-2 w-1/4">
    <label class="text-xs block" for="prompt">
        Steps
    </label>

    <select class="text-input" value={defaultRatio} on:change={handleAspectRatioChange}>
        {#each aspectRatios as ratio, i}
            <option value={i}>{ratio.label} ({ratio.width}x{ratio.height})</option>
        {/each}
    </select>
</div>
