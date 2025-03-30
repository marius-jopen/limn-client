<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import Button from '$lib/atoms/Button.svelte';
    import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';

    const dispatch = createEventDispatcher();

    export let resources: Array<{
        id: string;
        image_url: string;
        created_at: string;
    }> = [];

    let currentIndex = 0;
    let isPlaying = true;
    let animationFrameId: number;
    let lastFrameTime = 0;
    const FPS = 15;
    const frameDelay = 1000 / FPS;

    function close() {
        dispatch('close');
    }

    function animate(timestamp: number) {
        if (!lastFrameTime) lastFrameTime = timestamp;

        const elapsed = timestamp - lastFrameTime;

        if (elapsed > frameDelay) {
            currentIndex = (currentIndex + 1) % resources.length;
            lastFrameTime = timestamp;
        }

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    function togglePlayPause() {
        isPlaying = !isPlaying;
        if (isPlaying) {
            lastFrameTime = 0;
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    onMount(() => {
        if (resources.length > 0) {
            animationFrameId = requestAnimationFrame(animate);
        }
    });

    onDestroy(() => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    });

    $: currentImage = resources[currentIndex]?.image_url ? 
        transformToBunnyUrl(resources[currentIndex].image_url) : 
        null;
</script>

<div 
    class="fixed inset-0 bg-neutral-100/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-fade-in"
    on:click|self={close}
>
    <div class="max-w-4xl max-h-[90vh] relative">
        {#if currentImage}
            <img 
                src={currentImage + "?width=1000"} 
                alt="Animation frame" 
                class="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
        {/if}
        
        <div class="fixed top-3 right-4 flex gap-2">
            <Button
                label={isPlaying ? "Pause" : "Play"}
                variant="secondary"
                size="sm"
                onClick={togglePlayPause}
            />
            <Button
                label="Close"
                variant="secondary"
                size="sm"
                onClick={close}
            />
        </div>

        <div class="fixed bottom-3 left-4">
            <span class="text-sm text-gray-600">
                Frame {currentIndex + 1} of {resources.length}
            </span>
        </div>
    </div>
</div>

<style>
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
</style>
