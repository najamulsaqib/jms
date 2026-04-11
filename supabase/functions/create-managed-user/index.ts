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

    // Use the service role client for all operations — it can verify JWTs
    // and has the privileges needed to create auth users
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

    // Verify the caller has admin role
    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('user_id', callerUser.id)
      .single();

    if (profileError || callerProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ message: 'Forbidden: admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const { email, password, fullName, companyName, managedBy } =
      await req.json();

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({
          message: 'email, password, and fullName are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: {
          role: 'user',
          managed_by: managedBy ?? callerUser.id,
        },
        user_metadata: {
          full_name: fullName,
          company_name: companyName ?? '',
        },
      });

    if (createError) {
      return new Response(JSON.stringify({ message: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure email and managed_by are written to the profile (trigger may not capture these in all cases)
    await adminClient
      .from('profiles')
      .update({ email, managed_by: managedBy ?? callerUser.id })
      .eq('user_id', newUser.user.id);

    // Fetch the auto-created profile (created by the DB trigger)
    const { data: profile, error: fetchError } = await adminClient
      .from('profiles')
      .select(
        'user_id, email, full_name, company_name, role, managed_by, created_at, updated_at',
      )
      .eq('user_id', newUser.user.id)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ message: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
