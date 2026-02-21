import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create admin client
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });

    try {
        // Verify user
        const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // 1. Mark profile deleted
        const { error: profileErr } = await adminClient
            .from('profiles')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', user.id);

        if (profileErr) throw new Error(`Profile update failed: ${profileErr.message}`);

        // 2. Hide all plate listings
        const { error: listingsErr } = await adminClient
            .from('listings')
            .update({ status: 'hidden' })
            .eq('user_id', user.id);

        if (listingsErr) throw new Error(`Listings update failed: ${listingsErr.message}`);

        // 3. Hide all mobile number listings
        const { error: mobilesErr } = await adminClient
            .from('mobile_numbers')
            .update({ status: 'hidden' })
            .eq('user_id', user.id);

        if (mobilesErr) throw new Error(`Mobile numbers update failed: ${mobilesErr.message}`);

        // 4. Suspend user recursively in auth
        const { error: banErr } = await adminClient.auth.admin.updateUserById(
            user.id,
            { ban_duration: '87600h' } // Banned for 10 years
        );

        if (banErr) throw new Error(`User suspension failed: ${banErr.message}`);

        return res.status(200).json({ success: true });

    } catch (err: any) {
        console.error('Account soft-delete error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
