-- Update RLS policy to allow viewing sold listings publicly
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
CREATE POLICY "Anyone can view active or sold listings"
ON public.listings
FOR SELECT
USING (status IN ('active', 'sold'));

-- Update RLS policy for mobile_numbers to allow viewing sold numbers publicly
DROP POLICY IF EXISTS "Anyone can view active mobile numbers" ON public.mobile_numbers;
CREATE POLICY "Anyone can view active or sold mobile numbers"
ON public.mobile_numbers
FOR SELECT
USING (status IN ('active', 'sold'));