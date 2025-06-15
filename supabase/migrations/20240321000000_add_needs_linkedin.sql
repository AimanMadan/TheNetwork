-- Add needs_linkedin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS needs_linkedin BOOLEAN DEFAULT false;

-- Update existing profiles to set needs_linkedin based on their sign-in method
UPDATE profiles
SET needs_linkedin = true
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE raw_app_meta_data->>'provider' != 'linkedin_oidc'
);

-- Set needs_linkedin to false for LinkedIn sign-ins
UPDATE profiles
SET needs_linkedin = false
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE raw_app_meta_data->>'provider' = 'linkedin_oidc'
); 