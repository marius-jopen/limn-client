<script>
    import LimnGeneratorRow from '$lib/runpod/ui/limn/LimnGeneratorRow.svelte';

    // Array with image URLs and words
    let data = [
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Nature" },
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Adventure" },
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Explore" },
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Discover" },
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Journey" },
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Wonder" },
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Inspire" },
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Create" },
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Imagine" },
        { url: "https://limn-data.s3.eu-central-1.amazonaws.com/ui/sandbox.jpg", word: "Dream" }
    ];
</script>

<LimnGeneratorRow data={data} />
<LimnGeneratorRow data={data} />
<LimnGeneratorRow data={data} />