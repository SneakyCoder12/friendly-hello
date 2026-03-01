import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !PUBLIC_ANON_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { phone, password, normalizedPhone } = req.body;
    if (!phone || !password || !normalizedPhone) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });

    const authClient = createClient(SUPABASE_URL, PUBLIC_ANON_KEY, {
        auth: { persistSession: false },
    });

    try {
        const pseudoEmail = `${normalizedPhone}@phone-user.alnuami.com`;
        const { data: pseudoData, error: pseudoErr } = await authClient.auth.signInWithPassword({
            email: pseudoEmail,
            password
        });

        if (pseudoData?.session) {
            return res.status(200).json({ session: pseudoData.session });
        }

        const phoneWithPlus = `+${normalizedPhone}`;

        const { data: profiles, error: profileErr } = await adminClient
            .from('profiles')
            .select('id')
            .eq('phone_number', phoneWithPlus);

        if (profileErr) {
            throw new Error(`Profile lookup failed: ${profileErr.message}`);
        }

        if (profiles && profiles.length > 0) {
            const userId = profiles[0].id;

            const { data: userAuth, error: authErr } = await adminClient.auth.admin.getUserById(userId);

            if (userAuth?.user?.email) {
                const realEmail = userAuth.user.email;
                const { data: realData, error: realErr } = await authClient.auth.signInWithPassword({
                    email: realEmail,
                    password
                });

                if (realData?.session) {
                    return res.status(200).json({ session: realData.session });
                }
            }
        }

        return res.status(401).json({ error: 'Invalid login credentials' });

    } catch (err: any) {
        console.error('Login fallback error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
