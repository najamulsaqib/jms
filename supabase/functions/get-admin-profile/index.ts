// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify the calling user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user: callerUser },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the caller's own profile to determine their role and managed_by
    const { data: callerProfile, error: callerError } = await adminClient
      .from('profiles')
      .select('role, managed_by')
      .eq('user_id', callerUser.id)
      .single();

    if (callerError || !callerProfile) {
      return new Response(JSON.stringify({ message: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admins are their own company source; managed users look up their admin
    const targetId =
      callerProfile.role === 'admin' ? callerUser.id : callerProfile.managed_by;

    if (!targetId) {
      return new Response(
        JSON.stringify({ message: 'No admin profile associated' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select(
        'user_id, full_name, company_name, address, phone_number, description, avatar_url, created_at, updated_at, role, managed_by',
      )
      .eq('user_id', targetId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ message: 'Admin profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
