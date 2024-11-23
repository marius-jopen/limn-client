/**
 * This file initializes and exports the Supabase client for database interactions.
 * It uses environment variables for the Supabase URL and anonymous key to create
 * a connection to our Supabase backend.
 */

import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY) 