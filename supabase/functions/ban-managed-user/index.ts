// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.45.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

function getBearerToken(req: Request): string | null {
  const authHeader =
    req.headers.get('Authorization') ?? req.headers.get('authorization');

  if (!authHeader) return null;
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null;

  return authHeader.slice(7).trim() || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { message: 'Method not allowed' });
  }

  let body: { userId: string; ban: boolean };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { message: 'Invalid JSON body' });
  }

  const { userId, ban } = body ?? {};
  if (!userId || !isValidUUID(userId)) {
    return jsonResponse(400, { message: 'userId must be a valid UUID' });
  }
  if (typeof ban !== 'boolean') {
    return jsonResponse(400, { message: 'ban must be a boolean' });
  }

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return jsonResponse(401, {
      message: 'Missing or invalid Authorization header',
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  // Admin client for privileged DB/Auth operations
  const supabase = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: callerAuth, error: callerAuthErr } =
    await supabase.auth.getUser(accessToken);

  if (callerAuthErr || !callerAuth?.user) {
    return jsonResponse(401, {
      message: callerAuthErr?.message ?? 'Invalid or expired token',
    });
  }

  const callerId = callerAuth.user.id;

  // Caller must be admin
  const { data: callerProfile, error: callerProfileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', callerId)
    .maybeSingle();

  if (callerProfileErr) {
    return jsonResponse(500, { message: callerProfileErr.message });
  }
  if (!callerProfile || callerProfile.role !== 'admin') {
    return jsonResponse(403, { message: 'Forbidden: admin only' });
  }

  // Target must be managed by caller
  const { data: targetProfile, error: targetProfileErr } = await supabase
    .from('profiles')
    .select('user_id, managed_by')
    .eq('user_id', userId)
    .eq('managed_by', callerId)
    .maybeSingle();

  if (targetProfileErr) {
    return jsonResponse(500, { message: targetProfileErr.message });
  }
  if (!targetProfile) {
    return jsonResponse(403, {
      message: 'Forbidden: you do not manage this user',
    });
  }

  // Ban/unban in Supabase Auth
  const { error: banErr } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: ban ? '876000h' : 'none',
  });

  if (banErr) {
    return jsonResponse(500, { message: banErr.message });
  }

  // Sync is_banned to profiles and return the full row
  const { data: updatedProfile, error: updateErr } = await supabase
    .from('profiles')
    .update({ is_banned: ban })
    .eq('user_id', userId)
    .select(
      'user_id, email, full_name, company_name, role, managed_by, is_banned, created_at, updated_at',
    )
    .maybeSingle();

  if (updateErr) {
    return jsonResponse(500, { message: updateErr.message });
  }

  return jsonResponse(200, updatedProfile);
});
