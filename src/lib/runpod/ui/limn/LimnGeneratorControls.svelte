<script>
    import { fly, fade } from 'svelte/transition';
    import Button from '$lib/atoms/Button.svelte';
    
    export let data;
    export let currentFocusedIndex;
    export let ui_config;
    export let workflow;
    
    // Dropdown states
    let isAspectRatioOpen = false;
    let isResolutionOpen = false;
    let isDurationOpen = false;
    let isVersionOpen = false;
    let isPresetsOpen = false;
    
    // Selected values
    let selectedAspectRatio = "1:1";
    let selectedDuration = "5s";
    let selectedVersion = "basic";
    
    // Options with icons - updated aspect ratio icons to match screenshot
    const aspectRatios = [
        { value: "16:9", label: "16:9", icon: "🎞️" },  // Horizontal rectangle
        { value: "1:1", label: "1:1", icon: "📦" },    // Square
        { value: "9:16", label: "9:16", icon: "📱" }   // Vertical rectangle
    ];
    
    const durations = [
        { value: "15s", label: "15 seconds", icon: "🕑" },
        { value: "10s", label: "10 seconds", icon: "🕓" },
        { value: "5s", label: "5 seconds", icon: "🕖" }
    ];
    
    const versions = [
        { value: "basic", label: "basic", icon: "⭐" },
        { value: "fashion", label: "fashion", icon: "👕" },
        { value: "handmade", label: "handmade", icon: "✏️" }
    ];
    
    function toggleAspectRatio() {
        isAspectRatioOpen = !isAspectRatioOpen;
        isResolutionOpen = false;
        isDurationOpen = false;
        isVersionOpen = false;
        isPresetsOpen = false;
    }
    
    function toggleDuration() {
        isDurationOpen = !isDurationOpen;
        isAspectRatioOpen = false;
        isResolutionOpen = false;
        isVersionOpen = false;
        isPresetsOpen = false;
    }
    
    function toggleVersion() {
        isVersionOpen = !isVersionOpen;
        isAspectRatioOpen = false;
        isResolutionOpen = false;
        isDurationOpen = false;
        isPresetsOpen = false;
    }
    
    function selectAspectRatio(ratio) {
        selectedAspectRatio = ratio;
        isAspectRatioOpen = false;
    }

    function selectDuration(duration) {
        selectedDuration = duration;
        isDurationOpen = false;
    }
    
    function selectVersion(version) {
        selectedVersion = version;
        isVersionOpen = false;
    }
    
    // Helper function to get the icon for the selected value
    function getSelectedIcon(type) {
        if (type === 'aspectRatio') {
            return aspectRatios.find(r => r.value === selectedAspectRatio)?.icon || "📦";
        } else if (type === 'duration') {
            return durations.find(d => d.value === selectedDuration)?.icon || "🕛";
        } else if (type === 'version') {
            return versions.find(v => v.value === selectedVersion)?.icon || "⭐";
        }
        return "";
    }
</script>

<div class="relative">
    <textarea 
        class="w-full px-4 pt-2 pb-2 bg-gray-200 border-none resize-none focus:outline-none focus:ring-0" 
        placeholder="Enter a prompt"
        style="padding-top: 8px; text-align: left;" 
    ></textarea>

    <div class="flex gap-2 mt-2">
        <!-- Aspect Ratio Dropdown -->
        <div class="dropdown-container relative">
            <Button 
                label={`${getSelectedIcon('aspectRatio')} ${selectedAspectRatio}`}
                variant="secondary"
                size="sm"
                fullWidth={false}
                onClick={toggleAspectRatio}
                classes="{isAspectRatioOpen ? '!bg-gray-300' : ''} border border-gray-300"
            />
            
            {#if isAspectRatioOpen}
                <div 
                    class="overflow-hidden absolute bottom-full left-0 mb-2 bg-gray-200 shadow-lg rounded-lg py-2 z-10 min-w-[180px] text-black"
                    in:fly={{ y: 5, duration: 200 }}
                    out:fade={{ duration: 150 }}
                >
                    <h3 class="px-4 py-2 font-medium">Aspect ratio</h3>
                    
                    {#each aspectRatios as ratio}
                        <div class="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer" on:click={() => selectAspectRatio(ratio.value)}>
                            <div class="flex items-center gap-2">
                                <!-- Replace custom rectangles with the emoji icons -->
                                <div class="flex items-center justify-center text-xl">
                                    {ratio.icon}
                                </div>
                                <span>{ratio.label}</span>
                            </div>
                            <div class="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center">
                                {#if selectedAspectRatio === ratio.value}
                                    <div class="w-4 h-4 bg-gray-500 rounded-full"></div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
        
        
        <!-- Duration Dropdown -->
        <div class="dropdown-container relative">
            <Button 
                label={`${getSelectedIcon('duration')} ${selectedDuration}`}
                variant="secondary"
                size="sm"
                fullWidth={false}
                onClick={toggleDuration}
                classes="{isDurationOpen ? '!bg-gray-300' : ''} border border-gray-300"
            />
            
            {#if isDurationOpen}
                <div 
                    class="overflow-hidden absolute bottom-full left-0 mb-2 bg-gray-200 shadow-lg rounded-lg py-2 z-10 min-w-[180px] text-black"
                    in:fly={{ y: 5, duration: 200 }}
                    out:fade={{ duration: 150 }}
                >
                    <h3 class="px-4 py-2 font-medium">Duration</h3>
                    
                    {#each durations as duration}
                        <div class="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer" on:click={() => selectDuration(duration.value)}>
                            <div class="flex items-center gap-2">
                                <div class="w-6 h-6 flex items-center justify-center text-black">
                                    {duration.icon}
                                </div>
                                <span>{duration.label}</span>
                            </div>
                            <div class="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center">
                                {#if selectedDuration === duration.value}
                                    <div class="w-4 h-4 bg-gray-500 rounded-full"></div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
        
        <!-- Version Dropdown -->
        <div class="dropdown-container relative">
            <Button 
                label={`${getSelectedIcon('version')} ${selectedVersion}`}
                variant="secondary"
                size="sm"
                fullWidth={false}
                onClick={toggleVersion}
                classes="{isVersionOpen ? '!bg-gray-300' : ''} border border-gray-300"
            />
            
            {#if isVersionOpen}
                <div 
                    class="overflow-hidden absolute bottom-full left-0 mb-2 bg-gray-200 shadow-lg rounded-lg py-2 z-10 min-w-[180px] text-black"
                    in:fly={{ y: 5, duration: 200 }}
                    out:fade={{ duration: 150 }}
                >
                    <h3 class="px-4 py-2 font-medium">Style</h3>
                    
                    {#each versions as version}
                        <div class="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer" on:click={() => selectVersion(version.value)}>
                            <div class="flex items-center gap-2">
                                <div class="w-6 h-6 flex items-center justify-center">
                                    {version.icon}
                                </div>
                                <span>{version.label}</span>
                            </div>
                            <div class="w-6 h-6 rounded-full border border-gray-500 flex items-center justify-center">
                                {#if selectedVersion === version.value}
                                    <div class="w-4 h-4 bg-gray-500 rounded-full"></div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Spacer to push buttons to the right -->
        <div class="flex-grow"></div>
        
        <!-- Cancel Button -->
        <Button 
            label="Stop"
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={() => {}}
            classes="border border-gray-300 bg-gray-300 hover:!bg-red-400"
            title="Cancel"
        />
        
        <!-- Submit Button -->
        <Button 
            label="Send"
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={() => {}}
            classes="border border-gray-300 bg-gray-300 hover:!bg-primary"
            title="Submit"
        />
    </div>
</div>
