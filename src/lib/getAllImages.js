import { API_URLS } from '../lib/config.js';

export async function fetchImages(prefix) {
    try {
        const response = await fetch(API_URLS.server + "/output");
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        const data = await response.json();
        
        const filteredImages = data.images
            .filter(imageUrl => imageUrl.includes(prefix));
        
        return filteredImages.reverse();
    } catch (error) {
        return [];
    }
}