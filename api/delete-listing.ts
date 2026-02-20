import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET = 'plate-images';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate env
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get auth token from request
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create admin client (service role for privileged operations)
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
    });

    // Create user client to verify the JWT
    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    try {
        // Verify the user from the token
        const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Get the listing ID from the request body
        const { listingId } = req.body;
        if (!listingId || typeof listingId !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid listingId' });
        }

        // Fetch the listing to get plate_image_path and verify ownership
        const { data: listing, error: fetchError } = await adminClient
            .from('listings')
            .select('id, user_id, plate_image_path')
            .eq('id', listingId)
            .single();

        if (fetchError || !listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Check ownership or admin role
        const isOwner = listing.user_id === user.id;
        const { data: isAdmin } = await adminClient.rpc('is_admin', { _user_id: user.id } as any);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized to delete this listing' });
        }

        // Step 1: Delete the image from Supabase Storage
        if (listing.plate_image_path) {
            const { error: storageError } = await adminClient.storage
                .from(BUCKET)
                .remove([listing.plate_image_path]);

            if (storageError) {
                console.error('Storage deletion failed:', storageError.message);
                // Continue with DB deletion even if storage cleanup fails
            }
        }

        // Step 2: Delete associated favorites
        await adminClient
            .from('favorites')
            .delete()
            .eq('listing_id', listingId)
            .eq('listing_type', 'plate');

        // Step 3: Delete the listing record
        const { error: deleteError } = await adminClient
            .from('listings')
            .delete()
            .eq('id', listingId);

        if (deleteError) {
            return res.status(500).json({ error: `Failed to delete listing: ${deleteError.message}` });
        }

        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('Delete listing error:', err);
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
