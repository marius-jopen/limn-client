<script>
  import NavigationItem from './navigation-item.svelte';
</script>

<div class="z-10 bg-neutral-100/80 backdrop-blur-2xl w-screen h-screen top-0 left-0 fixed">
    <div class="flex justify-center items-center h-full">
        <div class="flex flex-row gap-8">
            <NavigationItem 
                href="/studio/deforum-limn"
                imageSrc="https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg"
                imageAlt="Sandbox"
                title="Sandbox"
            />
            
            <NavigationItem 
                href="/studio/deforum"
                imageSrc="https://limn-data.s3.eu-central-1.amazonaws.com/ui/fashion.png"
                imageAlt="Fashion"
                title="Fashion"
            />

            <NavigationItem 
                href="/studio/comfyui-flux"
                imageSrc="https://limn-data.s3.eu-central-1.amazonaws.com/ui/abstract.jpg"
                imageAlt="Abstract"
                title="Abstract"
            />
        </div>
    </div>
</div>