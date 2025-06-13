-- Secure database functions for user management
-- These functions include proper search_path settings to prevent security vulnerabilities

-- Function to handle new user registration
-- This function is typically called by a trigger when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Function to get all members of an organization, bypassing RLS restrictions
-- This allows users to see all members of organizations they're part of, and admins to see all organization members
CREATE OR REPLACE FUNCTION get_organization_members(org_id INTEGER)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin or a member of this organization
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM user_organizations 
    WHERE user_id = auth.uid() AND organization_id = org_id
  ) THEN
    RAISE EXCEPTION 'Access denied: You must be an admin or a member of this organization to view its members';
  END IF;

  RETURN QUERY
  SELECT p.*
  FROM profiles p
  INNER JOIN user_organizations uo ON p.id = uo.user_id
  WHERE uo.organization_id = org_id;
END;
$$;

-- Function to get all profiles for admin users, bypassing RLS restrictions  
-- This allows admin users to see all user profiles
CREATE OR REPLACE FUNCTION get_all_profiles_admin()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT * FROM profiles
  ORDER BY first_name;
END;
$$;

-- Test function to debug member count issues
CREATE OR REPLACE FUNCTION debug_organization_data(org_id INTEGER)
RETURNS TABLE (
  table_name TEXT,
  count_value BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Count profiles
  RETURN QUERY SELECT 'profiles'::TEXT, COUNT(*) FROM profiles;
  
  -- Count user_organizations for this org
  RETURN QUERY SELECT 'user_organizations'::TEXT, COUNT(*) FROM user_organizations WHERE organization_id = org_id;
  
  -- Count joined profiles for this org
  RETURN QUERY SELECT 'joined_profiles'::TEXT, COUNT(*) 
    FROM profiles p 
    INNER JOIN user_organizations uo ON p.id = uo.user_id 
    WHERE uo.organization_id = org_id;
END;
$$;

-- Create the trigger for new user registration
-- This trigger calls handle_new_user() when a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_organization_members(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_profiles_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_organization_data(INTEGER) TO authenticated; 