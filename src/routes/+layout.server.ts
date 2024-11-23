import type { LayoutServerLoad } from './$types';
import { supabase } from '$lib/supabase/supabaseClient';

export const load: LayoutServerLoad = async ({ locals }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
        session: session
    };
}; 