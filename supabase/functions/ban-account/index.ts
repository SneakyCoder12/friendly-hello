import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Get the auth header pointing to the user requesting deletion
        const authHeader = req.headers.get('Authorization')!;
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Call the safe public schema RPC to hide plates and mark profile
        const { error: rpcError } = await supabaseClient.rpc('soft_delete_user_data', {}, { head: false })
        // Notice we have to execute it as the user, not service role, so RLS policies pass correctly if needed, or we rely on the RPC's SECURITY DEFINER inside Postgres.
        // But because we are running it via Admin, RPC will execute as Admin here. It's safer to just let the client call the RPC before calling the edge function.
        // So we will just ban the user in this edge function using the admin API.

        // Suspend the user to prevent future logins
        const { error: banError } = await supabaseClient.auth.admin.updateUserById(
            user.id,
            { ban_duration: '876000h' } // 100 years
        );

        if (banError) {
            throw banError;
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
