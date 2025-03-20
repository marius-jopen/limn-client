import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Return the authentication info from locals (populated by hooks.server.js)
  return {
    user: locals.user,
    isAdmin: locals.isAdmin,
    appSource: locals.appSource
    // Include any other data you need to pass to your layout
  };
};
