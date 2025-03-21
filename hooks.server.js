// Get app_source if not admin
if (!isAdmin) {
  const { data: settingsData } = await supabase
    .from('user_settings')
    .select('app_source')
    .eq('user_id', user.id)
    .maybeSingle();
  
  appSource = settingsData?.app_source || '';
} 