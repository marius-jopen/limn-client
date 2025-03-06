/**
 * BunnyClient.ts
 * Utility functions for working with Bunny.net CDN
 */

// The S3 domains to replace - we need to handle multiple formats
const S3_DOMAIN_VIRTUAL_HOSTED = 'limn-data.s3.eu-central-1.amazonaws.com';
const S3_DOMAIN_PATH_STYLE = 's3.eu-central-1.amazonaws.com/limn-data';

// The Bunny.net domain to use
const BUNNY_DOMAIN = 'limn.b-cdn.net';

/**
 * Transforms an S3 URL to a Bunny.net URL
 * @param s3Url The original S3 URL
 * @returns The transformed Bunny.net URL
 */
export function transformToBunnyUrl(s3Url: string): string {
  if (!s3Url) return s3Url;
  
  // Handle virtual-hosted style URLs (bucket-name.s3.region.amazonaws.com)
  let transformedUrl = s3Url.replace(
    `https://${S3_DOMAIN_VIRTUAL_HOSTED}`,
    `https://${BUNNY_DOMAIN}`
  );
  
  // If the URL wasn't transformed, try the path-style format (s3.region.amazonaws.com/bucket-name)
  if (transformedUrl === s3Url) {
    transformedUrl = s3Url.replace(
      `https://${S3_DOMAIN_PATH_STYLE}`,
      `https://${BUNNY_DOMAIN}`
    );
  }
  
  return transformedUrl;
}

/**
 * Transforms an array of resources with image_url properties
 * @param resources Array of resources with image_url properties
 * @returns The same array with transformed URLs
 */
export function transformResourceUrls<T extends { image_url: string }>(resources: T[]): T[] {
  return resources.map(resource => ({
    ...resource,
    image_url: transformToBunnyUrl(resource.image_url)
  }));
}

/**
 * Purges a specific URL from the Bunny.net cache
 * Note: This requires API key configuration and is optional
 * @param url The URL to purge from cache
 */
export async function purgeCache(url: string): Promise<void> {
  // This is a placeholder for future implementation
  // Requires Bunny.net API key configuration
  console.log(`Cache purge requested for: ${url}`);
} 