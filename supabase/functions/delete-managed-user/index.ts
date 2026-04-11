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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } =
      await adminClient.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('user_id', callerUser.id)
      .single();

    if (profileError || callerProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ message: 'Forbidden: admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ message: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify this user is managed by the caller
    const { data: targetProfile, error: targetError } = await adminClient
      .from('profiles')
      .select('managed_by')
      .eq('user_id', userId)
      .single();

    if (targetError || targetProfile?.managed_by !== callerUser.id) {
      return new Response(
        JSON.stringify({ message: 'Forbidden: you do not manage this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      return new Response(JSON.stringify({ message: deleteError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
