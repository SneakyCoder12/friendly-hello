# Lovable Prompt — V2 Changes (Dashboard, Admin, Login, Mobile Numbers)

Copy everything below the line and paste it into Lovable as a single prompt.

---

## ⚠️ IMPORTANT — DO NOT TOUCH THESE:
- **The Number Plate Generator / Plate Card flip animation**: The existing plate rendering engine (`PlateGenerator.tsx`, `PlateCard.tsx`, `plate-generator.js`) and the card flip effect on the homepage **must remain exactly as they are**. Do NOT modify, refactor, or simplify any plate rendering logic, canvas drawing, or card animations. They are pixel-perfect and carefully tuned.

---

## 1. 🔐 LOGIN PAGE — Phone Number Input with Country Code & Validation

**File:** `LoginPage.tsx`

Currently, the login page only has Email + Password fields. I want you to **add a "Login with Phone Number" option** as well (or at minimum, allow login by phone number in addition to email). Here's exactly what I need:

### Requirements:
1. **Country Code Selector**: Add a dropdown/button before the phone number input that defaults to **+971 (UAE)**. The user should be able to tap it to change to other country codes (show a small list of common ones: +971 UAE, +966 Saudi, +968 Oman, +973 Bahrain, +974 Qatar, +965 Kuwait, +44 UK, +1 US, +91 India, +92 Pakistan).
2. **UAE Flag Icon**: Show a small UAE flag emoji or icon (🇦🇪) next to the default +971 code.
3. **Phone Number Validation**:
   - For UAE numbers (+971): Must be exactly **9 digits** after the country code (e.g., `50 123 4567`). The number must start with `50`, `52`, `54`, `55`, `56`, or `58`.
   - Show a red inline error message if the format is invalid (e.g., "Please enter a valid UAE mobile number").
   - Auto-format the number as the user types (e.g., `50 123 4567`).
4. **Toggle between Email and Phone login**: Add a small text link or toggle below the form that says "Login with Phone Number" / "Login with Email" so the user can switch.
5. **Password Validation**: Add minimum requirements hint — "Password must be at least 6 characters" shown as a subtle helper text below the password field.
6. **"Remember Me" Checkbox**: Optional but nice to have.

### Also fix on `SignupPage.tsx`:
- The phone number field on signup should also have the **+971 country code prefix** and the **same validation rules** described above.
- After signup, make sure the phone number (with country code) is saved to the `profiles` table in the `phone_number` column.

---

## 2. 📊 DASHBOARD PAGE — Complete Redesign for Bulk Entry

**File:** `DashboardPage.tsx`

The current dashboard only lets users add **one plate at a time** using a simple form. I want to redesign it so users can add **10–15 numbers at once** using a dynamic row-based form. Here's exactly what I need:

### Requirements:

1. **Dynamic Multi-Row Form**: Instead of the single "Add Listing" form, show a table/list of editable rows. Each row has these fields **inline**:
   - **Plate Number** (text input, required)
   - **Emirate** (dropdown: Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah)
   - **Plate Style / Code** (text input, e.g., "A", "AA", "P", etc.)
   - **Price (AED)** (number input)
   - **Description** (text input — short one-liner)
   - **Contact Email** (text input — auto-fill with user's email)
   - **Contact Phone** (text input — auto-fill with user's phone from profile)
   - **Delete Row** button (🗑️ icon) to remove that row

2. **"+ Add Another" Button**: A prominent button below the rows that adds a new empty row. Start with **1 row** visible by default. User can keep clicking "+" to add more rows (up to 20 max).

3. **"Save All" Button**: A single button at the bottom that submits **all rows at once** in a batch insert to the `listings` table in Supabase. Show a loading spinner during save and a success toast with the count (e.g., "12 listings created successfully!").

4. **Auto-Fill Smart Defaults**: When adding a new row, auto-fill:
   - Emirate → same as the previous row (so if user is adding 10 Dubai plates, they only set it once)
   - Contact Email → from `user.email`
   - Contact Phone → from `profile.phone_number`

5. **Listing Table Below**: Keep the existing listing table below the form, but make it look more polished:
   - Add a **search/filter bar** at the top to search by plate number
   - Add **filter buttons** for status (All, Active, Sold, Hidden)
   - Show the **plate number in a styled plate badge** (not just plain text)
   - Add **pagination** if there are more than 20 listings (or "Load More" button)

6. **Profile Card**: The profile section at the top is fine, but add the user's **email** more prominently and show a small badge if the user is an admin.

---

## 3. 👑 ADMIN PANEL — Track Who Added What

**File:** `AdminPage.tsx`

The admin panel currently shows listings but does NOT show **who submitted each listing**. I need to know which user added which plate number.

### Requirements:

1. **User Reference on Every Listing**: In the "All Listings" tab, each listing row should show:
   - Plate Number
   - Emirate
   - Price
   - Status
   - **Added By** → Show the **user's email** (or phone number, or full name) fetched from the `profiles` table by joining on `user_id`.
   - **Date Added** → Show the `created_at` timestamp in a readable format (e.g., "14 Feb 2026")

2. **Expandable User Detail**: When you click on a user's name/email in the listing, optionally show a small popup or expand section showing:
   - User's full name
   - User's email
   - User's phone number
   - Total listings by this user
   - Date user joined

3. **Search & Filter in Admin Listings**:
   - Search bar that searches by plate number OR by user email/name
   - Filter dropdown by Emirate
   - Filter by Status (active, sold, hidden)
   - Sort by: Date Added (newest first), Price (high to low), etc.

4. **Users Tab Enhancement**: The "Users" tab currently only shows name and phone. Improve it to show:
   - Full Name
   - Email (fetched from Supabase Auth or stored in profiles)
   - Phone Number
   - **Number of Listings** this user has
   - **Join Date**
   - A **"View Listings"** button that filters the listings tab to show only that user's listings

5. **Analytics Tab Enhancement**: Add more stats:
   - **Listings by Emirate** (mini bar chart or just numbers)
   - **Most Active Users** (top 5 users by listing count)
   - **Recent Activity** feed (last 10 actions — "User X added plate Y")

6. **Bulk Upload Enhancement**: The current bulk upload only lets you paste plate numbers with one shared emirate/price. Enhance it to allow:
   - Per-row fields: plate_number, emirate, price, plate_style (comma-separated in text mode)
   - CSV format: `plate_number,emirate,price,plate_style`
   - Show a **preview table** of what will be imported before confirming

---

## 4. 📱 MOBILE NUMBERS SECTION — Du & Etisalat Logos

**File:** `MobileNumbers.tsx`

Currently the carrier name ("Du", "Etisalat") is shown as a plain text badge. Replace it with the **actual carrier logos**.

### Requirements:
1. **Etisalat Logo**: Use the official Etisalat (now "e&") logo. Place the image file at `/public/etisalat-logo.png`. Show it as a small icon (about 40px × 20px) in the card where the carrier badge currently is.
2. **Du Logo**: Use the official Du logo. Place the image file at `/public/du-logo.png`. Show it as a small icon (about 40px × 20px) in the card.
3. **Keep the color coding**: Etisalat cards should still have the green accent, Du cards should still have the blue accent. Just replace the text badge with the logo image.
4. If the logo images are not available, generate placeholder badges that say "e&" and "du" in their respective brand colors (Etisalat green #00a651, Du blue #003b71) with a modern rounded pill shape.

---

## 5. 🗄️ DATABASE / SUPABASE SCHEMA CHECK

Please confirm or add these columns to the **`listings`** table:
- `user_id` (uuid, references auth.users) — **already exists**, just confirm
- `contact_email` (text, nullable) — for the contact email field
- `contact_phone` (text, nullable) — for the contact phone field

And in the **`profiles`** table, confirm:
- `id` (uuid, references auth.users)
- `full_name` (text)
- `phone_number` (text)
- `email` (text) — Add this column if it doesn't exist, so the admin panel can easily query user emails without needing to call Supabase Auth API separately. Auto-populate from auth on signup.

---

## 6. 🐛 CRITICAL FIX — Listings Not Showing on Homepage/Marketplace

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
- [ ] Login page: Add phone login with +971 country code selector and validation
- [ ] Signup page: Add +971 country code to phone field with validation
- [ ] Dashboard: Redesign to multi-row bulk entry with "+" button (10-15 at once)
- [ ] Dashboard: Better listing table with search, filter, and styled plate badges
- [ ] Admin: Show "Added By" (email/phone/name) for every listing
- [ ] Admin: Enhanced Users tab with listing count and "View Listings" button
- [ ] Admin: Better analytics with per-emirate stats and most active users
- [ ] Admin: Improved bulk upload with per-row fields and preview
- [ ] Mobile Numbers: Replace carrier text badges with Du and Etisalat logos
- [ ] Database: Add `contact_email`, `contact_phone` to listings; add `email` to profiles
- [ ] **BUG FIX** — Set `status: 'active'` on insert + database default so listings appear on homepage/marketplace
- [ ] **BUG FIX** — Confirm homepage "Coming Soon" placeholder auto-replaces when real listings are added for that emirate
- [ ] **BUG FIX** — Confirm marketplace shows all active listings from all users
- [ ] **BUG FIX** — Confirm RLS policies enforce per-user data isolation on dashboard (no cross-user data leaks)

