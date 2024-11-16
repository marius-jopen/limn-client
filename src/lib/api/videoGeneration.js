import { config } from '../config';

export async function generateImage(imageRequest) {
    try {
        const response = await fetch(config.server + "/generate-image-1111-runpod-pod", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(imageRequest)
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.imageUrl;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}

export async function generateVideo(videoRequest) {
    try {
        const response = await fetch(config.server + "/generate-deforum-1111-runpod-pod", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(videoRequest)
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
