<script>
    function handleBack() {
        if (window.history.length > 1) {
            window.history.back();
        }
    }
</script>

<button 
    on:click={handleBack}
    class="back-button"
    aria-label="Go back"
    type="button"
>
    Back
</button> 