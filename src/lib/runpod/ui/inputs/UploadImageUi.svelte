<script lang="ts">
    import Label from "$lib/atoms/Label.svelte";

    export let label: string = "";
    export let value: string = "";
    export let id: string = "";
    export let userId: string = "";

    let uploading = false;
    let error: string | null = null;
    let preview: string | null = null;
    let status: string = 'Ready';

    async function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (!file) return;

        if (!userId) {
            error = "No userId provided for upload";
            status = "Upload failed";
            console.error("Upload attempted without userId");
            return;
        }

        // Reset previous state
        value = '';
        preview = null;
        error = null;
        
        console.log('Starting upload with:', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            userId: userId  // Log the actual userId value
        });

        status = 'Starting upload...';
        uploading = true;

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('userId', userId);

            status = 'Sending to server...';
            console.log('Sending to server with FormData:', {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                userId: userId
            });
            
            const response = await fetch('http://localhost:4000/api/s3-upload', {
                method: 'POST',
                body: formData
            });

            console.log('Server response status:', response.status);
            const responseText = await response.text();
            console.log('Server response text:', responseText);

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${responseText}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error('Invalid JSON response from server');
            }

            console.log('Parsed response data:', data);
            
            if (data.success && data.url) {
                value = data.url;
                preview = data.url;
                status = 'Upload successful!';
                console.log('Upload completed:', data.url);
            } else {
                throw new Error(data.error || 'Upload failed without error message');
            }

        } catch (err) {
            console.error('Upload error:', err);
            error = err instanceof Error ? err.message : 'Upload failed';
            status = 'Upload failed';
            // Clear any old values
            value = '';
            preview = null;
        } finally {
            uploading = false;
        }
    }
</script>

<div class="flex flex-col gap-2">
    <Label for_id={id} {label} />
    
    <div class="text-sm mb-2">
        Status: <span class={status === 'Upload successful!' ? 'text-green-500' : 
                          status === 'Upload failed' ? 'text-red-500' : 
                          'text-blue-500'}>{status}</span>
    </div>

    <div class="relative">
        <input
            type="file"
            {id}
            accept="image/*"
            on:change={handleFileChange}
            disabled={uploading}
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div class="flex items-center justify-center w-full h-10 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
            {value ? 'Change image' : 'Choose image'}
        </div>
    </div>
    
    {#if uploading}
        <div class="text-sm text-blue-500 flex items-center">
            <svg class="animate-spin h-5 w-5 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {status}
        </div>
    {/if}

    {#if error}
        <div class="text-sm text-red-500 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
        </div>
    {/if}

    {#if preview}
        <div class="relative w-full max-w-md mt-2">
            <img 
                src={preview} 
                alt="Upload preview" 
                class="rounded-md shadow-sm max-h-48 object-contain"
            />
            <button
                on:click={() => {
                    preview = null;
                    value = '';
                    status = 'Ready';
                }}
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                type="button"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    {/if}

    {#if value}
        <div class="text-sm text-gray-500 break-all">
            Uploaded URL: {value}
        </div>
    {/if}
</div> 