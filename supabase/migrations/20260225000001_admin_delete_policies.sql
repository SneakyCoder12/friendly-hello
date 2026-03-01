-- Allow admins to delete any listing
CREATE POLICY "Admins can delete any listing"
ON public.listings
FOR DELETE
USING (public.is_admin());

-- Allow admins to delete any mobile number
CREATE POLICY "Admins can delete any mobile number"
ON public.mobile_numbers
FOR DELETE
USING (public.is_admin());
