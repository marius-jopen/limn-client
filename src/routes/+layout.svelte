<script>
    import "../app.css";
  </script>

<nav class="flex gap-4 py-4 px-4 bg-gray-100">
    <a href="/generate-image-1111-select" class="button">Generate Image 1111 Select</a>
    <a href="/generate-image-1111-local" class="button">Generate Image 1111 Local</a>
    <a href="/generate-image-1111-runpod-serverless" class="button">Generate Image 1111 RunPod Serverless</a>
    <a href="/generate-image-1111-runpod-pod" class="button">Generate Image 1111 RunPod Pod</a>
</nav>

<main class="py-4 px-4">
    <slot></slot>
</main>