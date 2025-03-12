import type { RequestEvent } from '@sveltejs/kit';

export const load = async ({ params }: RequestEvent) => {
    const imageId = params.image;
    console.log('Image ID from URL:', imageId);
    
    return {
        imageId
    };
}; 