// Get app_source if not admin
if (!isAdmin) {
  const { data: settingsData } = await supabase
    .from('user_settings')
    .select('app_source')
    .eq('user_id', user.id)
    .maybeSingle();
  
  appSource = settingsData?.app_source || '';
} 

// Get the session from the request
const { data: { session } } = await supabase.auth.getSession();

// If not logged in, redirect to login
if (matchedRoute && !user) {
    throw redirect(303, '/login');
} 

export async function handle({ event, resolve }) {
    const { data: { session } } = await supabase.auth.getSession();
    event.locals.session = session;
    
    let user = null;
    let isAdmin = false;
    let appSource = '';
    
    if (session) {
        user = session.user;
        
        if (user) {
            // Check if user is admin
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
                    .eq('user_id', user.id)
                    .maybeSingle();
                
                appSource = settingsData?.app_source || '';
            }
        }
    }

    // Store user info in locals
    event.locals.user = user;
    event.locals.isAdmin = isAdmin;
    event.locals.appSource = appSource;

    const currentPath = event.url.pathname;
    const matchedRoute = protectedRoutes.find(route => 
        currentPath.startsWith(route.path)
    );

    if (matchedRoute) {
        // Don't redirect if we're already on the login page
        if (currentPath === '/login') {
            return resolve(event);
        }

        // Debug info
        console.log({
            path: currentPath,
            hasUser: !!user,
            isAdmin,
            appSource,
            requiredRoles: matchedRoute.requiredRoles
        });

        if (!user) {
            throw redirect(303, '/login');
        }

        // Check role-based access
        const userRole = isAdmin ? 'admin' : appSource;
        const hasAccess = isAdmin || matchedRoute.requiredRoles.includes(userRole);

        if (!hasAccess) {
            console.log('Access denied:', { userRole, requiredRoles: matchedRoute.requiredRoles });
            throw redirect(303, '/unauthorized');
        }
    }

    return resolve(event);
} 