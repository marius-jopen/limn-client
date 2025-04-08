<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import Button from '$lib/atoms/Button.svelte';
    import { transformToBunnyUrl } from '$lib/bunny/BunnyClient';
    import RecordRTC from 'recordrtc';

    const dispatch = createEventDispatcher();

    // Configuration constants
    const WIDTH = 768;
    const HEIGHT = 768;
    const FPS = 15;
    const FRAME_DELAY = 1000 / FPS;
    const REPEAT_COUNT = 3;  // <-- Added this variable to control repetitions

    export let resources: Array<{
        id: string;
        image_url: string;
        created_at: string;
    }> = [];

    let currentIndex = 0;
    let isPlaying = true;
    let animationFrameId: number;
    let recordingCanvas: HTMLCanvasElement;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let isGenerating = false;
    let progress = 0;
    
    // Sort resources by creation date to ensure correct order
    $: sortedResources = [...resources].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    onMount(() => {
        ctx = canvas.getContext('2d');
        startAnimation();
    });

    onDestroy(() => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    });

    function close() {
        dispatch('close');
    }

    function getFormattedDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}-${hours}${minutes}${seconds}`;
    }

    async function downloadVideo(mode: 'single' | 'boomerang' | 'repeat') {
        if (isGenerating || resources.length === 0) return;
        isGenerating = true;
        progress = 0;

        recordingCanvas = document.createElement('canvas');
        recordingCanvas.width = WIDTH;
        recordingCanvas.height = HEIGHT;
        const recordingCtx = recordingCanvas.getContext('2d');

        try {
            const loadedImages = await Promise.all(
                sortedResources.map(resource => 
                    new Promise<HTMLImageElement>((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.src = transformToBunnyUrl(resource.image_url);
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                    })
                )
            );

            const stream = recordingCanvas.captureStream(FPS);
            const recorder = new RecordRTC(stream, {
                type: 'video',
                mimeType: 'video/mp4',
                frameRate: FPS,
                quality: 10,
                width: WIDTH,
                height: HEIGHT,
                videoBitsPerSecond: 8000000,
                frameInterval: 1,
                numberOfAudioChannels: 0,
                disableLogs: true
            });

            recorder.startRecording();

            let framesToRender: HTMLImageElement[] = [];
            
            if (mode === 'single') {
                framesToRender = [...loadedImages];
            } else if (mode === 'boomerang') {
                framesToRender = [
                    ...loadedImages,
                    ...loadedImages.slice().reverse().slice(1)
                ];
            } else if (mode === 'repeat') {
                framesToRender = [
                    ...loadedImages,
                    ...loadedImages,
                    ...loadedImages
                ];
            }

            // Draw all frames
            for (let i = 0; i < framesToRender.length; i++) {
                await new Promise<void>(resolve => {
                    recordingCtx.clearRect(0, 0, WIDTH, HEIGHT);
                    recordingCtx.drawImage(framesToRender[i], 0, 0, WIDTH, HEIGHT);
                    progress = (i / framesToRender.length) * 100;
                    setTimeout(resolve, FRAME_DELAY);
                });
            }

            // Ensure last frame is captured
            await new Promise(resolve => setTimeout(resolve, FRAME_DELAY * 2));

            recorder.stopRecording(() => {
                const blob = recorder.getBlob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const suffix = mode === 'boomerang' ? 'boomerang' : 
                             mode === 'repeat' ? 'repeat3x' : 'single';
                a.download = `limn-${getFormattedDateTime()}-${suffix}.mp4`;
                a.click();
                URL.revokeObjectURL(url);
                isGenerating = false;
                progress = 0;
            });

        } catch (error) {
            console.error('Error generating video:', error);
            alert('Failed to generate video. Please try again.');
        } finally {
            isGenerating = false;
            progress = 0;
            recordingCanvas = null;
        }
    }

    // Keep the preview animation separate and simple
    function startAnimation() {
        if (sortedResources.length === 0) return;
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = transformToBunnyUrl(sortedResources[currentIndex].image_url);
        img.onload = () => {
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
            currentIndex = (currentIndex + 1) % sortedResources.length;
            if (isPlaying) {
                setTimeout(() => {
                    animationFrameId = requestAnimationFrame(startAnimation);
                }, FRAME_DELAY);
            }
        };
    }

    function togglePlayPause() {
        isPlaying = !isPlaying;
        if (isPlaying) {
            startAnimation();
        }
    }

    $: currentImage = resources[currentIndex]?.image_url ? 
        transformToBunnyUrl(resources[currentIndex].image_url) : 
        null;
</script>

<div class="fixed inset-0 bg-neutral-100/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-fade-in">
    <div class="max-w-4xl max-h-[90vh] relative flex flex-col items-center">
        <canvas
            bind:this={canvas}
            width={WIDTH}
            height={HEIGHT}
            class="max-w-full max-h-[90vh] object-contain rounded-xl"
        />
        
        <div class="mt-4 flex flex-col md:flex-row gap-2 md:gap-4 w-full md:w-auto md:inline-flex items-center md:items-start">
            <Button
                variant="secondary"
                size="sm"
                onClick={togglePlayPause}
                classes="w-full md:w-auto md:whitespace-nowrap max-w-[200px] md:max-w-none"
            >
                {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadVideo('single')}
                disabled={isGenerating}
                classes="w-full md:w-auto md:whitespace-nowrap max-w-[200px] md:max-w-none"
            >
                Download Video
            </Button>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadVideo('boomerang')}
                disabled={isGenerating}
                classes="w-full md:w-auto md:whitespace-nowrap max-w-[200px] md:max-w-none"
            >
                Download Boomerang
            </Button>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadVideo('repeat')}
                disabled={isGenerating}
                classes="w-full md:w-auto md:whitespace-nowrap max-w-[200px] md:max-w-none"
            >
                Download 3x Repeat
            </Button>
        </div>

        <div class="h-6 mt-2 text-sm text-gray-600 text-center">
            {#if isGenerating}
                Generating video... {progress.toFixed(0)}%
            {/if}
        </div>

        <div class="fixed top-3 right-4">
            <Button
                label="Close"
                variant="secondary"
                size="sm"
                onClick={close}
            />
        </div>
    </div>
</div>

<style>
    /* Animation for preview overlay */
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
</style>
