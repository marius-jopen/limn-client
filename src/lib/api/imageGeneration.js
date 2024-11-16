import { config } from '$lib/config.js';

export async function generateImage(endpoint, params) {
    try {
        const response = await fetch(`${config.server}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}