<script>
    import "../app.css";
  </script>



<main class="flex">
    <div class="bg-gray-200 h-screen py-2 px-2">
        <a href="/generate-image-1111-local" class="py-1 block text-xs px-2">Generate Image 1111 Local</a>
        <a href="/generate-image-1111-runpod-serverless" class="py-1 block text-xs px-2">Generate Image 1111 RunPod Serverless</a>
        <a href="/generate-image-1111-runpod-pod" class="py-1 block text-xs px-2">Generate Image 1111 RunPod Pod</a>
        <a href="/generate-deforum-1111-runpod-pod" class="py-1 block text-xs px-2">Generate Deforum 1111 RunPod Pod</a>
    </div>

    <div class="py-4 px-4">
        <slot></slot>
    </div>
</main>