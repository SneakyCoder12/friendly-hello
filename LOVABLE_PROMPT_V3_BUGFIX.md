# Lovable Prompt — V3 Bug Fix (Listings Not Showing)

Copy everything below the line and paste it into Lovable as a single prompt.

---

## ⚠️ IMPORTANT — DO NOT TOUCH THESE:
- **The Number Plate Generator / Plate Card flip animation**: The existing plate rendering engine (`PlateGenerator.tsx`, `PlateCard.tsx`, `plate-generator.js`) and the card flip effect on the homepage **must remain exactly as they are**. Do NOT modify, refactor, or simplify any plate rendering logic, canvas drawing, or card animations. They are pixel-perfect and carefully tuned.

---

## 🐛 CRITICAL FIX — Listings Not Showing on Homepage/Marketplace

**This is a BUG that must be fixed.** When a user logs in, goes to the Dashboard, and adds a number plate, the plate does **NOT appear** on the Homepage or the Marketplace. Here's what's broken and how to fix it:

### Root Cause:
The `DashboardPage.tsx` inserts new listings **without setting `status`** explicitly. The Homepage (`PlateListings.tsx`) and Marketplace (`MarketplacePage.tsx`) both filter with `.eq('status', 'active')`. If the database doesn't have a default value of `'active'` on the `status` column, newly created listings will have `null` status and **never show up** anywhere.

### Fix Requirements:

1. **Set Default Status on Insert**: When creating a new listing from the Dashboard, **always set `status: 'active'`** in the insert payload. Example:
   ```js
   const payload = {
     plate_number: ...,
     emirate: ...,
     price: ...,
     user_id: user.id,
     status: 'active',  // ← ADD THIS
   };
   ```

2. **Also Set Database Default**: Add a default value on the `listings.status` column in Supabase:
   ```sql
   ALTER TABLE listings ALTER COLUMN status SET DEFAULT 'active';
   ```
   This ensures even bulk uploads or CSV imports that don't specify status still get `'active'` by default.

3. **Homepage Auto-Replace Logic (Confirm Working)**: The Homepage uses `PlateListings.tsx` which fetches all active listings from Supabase, groups them by emirate (max 4 per emirate), and passes them to `EmirateSection.tsx`. If an emirate has 0 listings, it shows a "Coming Soon" placeholder card with "X XXX". **As soon as a real listing exists for that emirate, the placeholder must automatically disappear and the real plate(s) must show.** This logic already exists in `EmirateSection.tsx` (`hasListings ? ... : comingSoon`). Just **confirm it works** after the status fix above. If it doesn't work, fix the grouping logic — the key mapping is:
   - `'Abu Dhabi'` → `'abudhabi'`
   - `'Dubai'` → `'dubai'`
   - `'Sharjah'` → `'sharjah'`
   - `'Ajman'` → `'ajman'`
   - `'Umm Al Quwain'` → `'umm_al_quwain'`
   - `'Ras Al Khaimah'` → `'rak'`
   - `'Fujairah'` → `'fujairah'`
   Make sure the emirate value saved from the Dashboard dropdown **exactly matches** one of these keys (e.g., `'Abu Dhabi'` not `'abu dhabi'` or `'Abu-Dhabi'`).

4. **Marketplace Must Show All Active Listings**: The Marketplace page (`MarketplacePage.tsx`) fetches all listings with `status = 'active'`. After the status fix, every plate added from the Dashboard should automatically appear in the Marketplace too. **Confirm this works.**

5. **Per-User Data Isolation (Supabase RLS)**:
   - Each user's listings belong **only to them** via `user_id`.
   - On the **Dashboard**: A user should ONLY see their own listings (query filtered by `user_id = auth.uid()`). ✅ This already works.
   - On the **Homepage & Marketplace**: ALL active listings from ALL users should be visible (this is a public marketplace). ✅ This is correct.
   - **Supabase Row Level Security (RLS)** must enforce:
     - `SELECT`: Anyone can read listings with `status = 'active'` (for homepage/marketplace). Authenticated users can also read their own listings regardless of status (for their dashboard).
     - `INSERT`: Only authenticated users can insert, and `user_id` must equal `auth.uid()`.
     - `UPDATE` / `DELETE`: Only the owner (`user_id = auth.uid()`) or admin can modify/delete.
   - **Confirm** that RLS policies are set up correctly so no user can see, edit, or delete another user's listings from the Dashboard. Each login is completely isolated.

6. **After Adding a Plate, Redirect or Refresh**: After successfully adding plate(s) from the Dashboard, the listing table below the form should **immediately refresh** to show the new entries. The user should see their newly added plates in the "My Listings" section right away — no page reload needed.

---

## Summary Checklist:
- [ ] **DO NOT** change plate generator, plate card, or flip animations
- [ ] **BUG FIX** — Set `status: 'active'` on insert + database default so listings appear on homepage/marketplace
- [ ] **BUG FIX** — Confirm homepage "Coming Soon" placeholder auto-replaces when real listings are added for that emirate
- [ ] **BUG FIX** — Confirm marketplace shows all active listings from all users
- [ ] **BUG FIX** — Confirm RLS policies enforce per-user data isolation on dashboard (no cross-user data leaks)
- [ ] **BUG FIX** — Dashboard listing table refreshes immediately after adding new plates

