-- Backfill phone_number for pseudo-email users (971xxx@phone-user.alnuami.com)
UPDATE profiles 
SET phone_number = '+' || split_part(email, '@', 1)
WHERE email LIKE '%@phone-user.alnuami.com' 
  AND phone_number IS NULL;