const serverUrl = import.meta.env.VITE_SERVER_URL;

export async function generateVideo(endpoint, params) {
    try {
        const response = await fetch(`${serverUrl}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        console.log('Video generation request sent successfully.');
    } catch (error) {
        console.error('Error generating video:', error);
        throw error;
    }
}
