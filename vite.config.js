/**
 * Vite Configuration File
 * 
 * This file configures Vite.js for a SvelteKit project:
 * - Sets up the SvelteKit plugin to enable SvelteKit functionality
 * - Vite handles bundling, dev server, and build optimization
 * - This is a minimal configuration that enables basic SvelteKit features
 */

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});
