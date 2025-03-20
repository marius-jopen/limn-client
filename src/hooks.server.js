import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase/helper/SupabaseClient';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Get the session from the request
  const { data: { session } } = await supabase.auth.getSession();
  event.locals.session = session;
  
  // Get user info if logged in
  let user = null;
  let isAdmin = false;
  let appSource = '';
  
  if (session) {
    user = session.user;
    
    // Check if user is admin
    if (user) {
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      isAdmin = !!adminData;
      
      // Get app_source if not admin
      if (!isAdmin) {
        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('app_source')
          .eq('id', user.id)
          .maybeSingle();
        
        appSource = settingsData?.app_source || '';
      }
    }
  }
  
  // Store user info in locals
  event.locals.user = user;
  event.locals.isAdmin = isAdmin;
  event.locals.appSource = appSource;
  
  // Define route protection rules
  const protectedRoutes = [
    {
      path: '/dashboard',
      requiredRoles: ['admin', 'limn']
    },
    {
      path: '/studio/latent-shift',
      requiredRoles: ['admin', 'limn']
    },
    {
      path: '/studio/comfyui',
      requiredRoles: ['admin']
    },
    {
      path: '/studio/comfyui-flux',
      requiredRoles: ['admin']
    },
    {
      path: '/studio/a1111',
      requiredRoles: ['admin']
    },
    {
      path: '/studio/deforum',
      requiredRoles: ['admin']
    },
    {
      path: '/studio/output',
      requiredRoles: ['admin']
    },
    {
      path: '/admin',
      requiredRoles: ['admin']
    }
  ];
  
  // Check if current route is protected
  const currentPath = event.url.pathname;
  const matchedRoute = protectedRoutes.find(route => 
    currentPath.startsWith(route.path)
  );
  
  // Handle route protection
  if (matchedRoute) {
    // If not logged in, redirect to login
    if (!user) {
      throw redirect(303, '/login');
    }
    
    // Check role-based access
    const userRole = isAdmin ? 'admin' : appSource;
    const hasAccess = isAdmin || matchedRoute.requiredRoles.includes(userRole);
    
    if (!hasAccess) {
      // Redirect to dashboard or show unauthorized page
      throw redirect(303, '/unauthorized');
    }
  }
  
  return resolve(event);
} 