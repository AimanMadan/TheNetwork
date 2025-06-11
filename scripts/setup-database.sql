-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- GET /api/profiles - List all profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

-- PATCH /api/profiles/:id - Update own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- POST /api/profiles - Create own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations policies
-- GET /api/organizations - List all organizations
CREATE POLICY "Users can view all organizations" ON public.organizations
  FOR SELECT USING (true);

-- POST /api/organizations - Create new organization (admin only)
CREATE POLICY "Only admins can insert organizations" ON public.organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PATCH /api/organizations/:id - Update organization (admin only)
CREATE POLICY "Only admins can update organizations" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE /api/organizations/:id - Delete organization (admin only)
CREATE POLICY "Only admins can delete organizations" ON public.organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User organizations policies
-- GET /api/user-organizations - List all user-organization relationships
CREATE POLICY "Users can view all user-organization relationships" ON public.user_organizations
  FOR SELECT USING (true);

-- POST /api/user-organizations - Join an organization
CREATE POLICY "Users can join organizations" ON public.user_organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DELETE /api/user-organizations/:id - Leave an organization
CREATE POLICY "Users can leave organizations" ON public.user_organizations
  FOR DELETE USING (auth.uid() = user_id);

-- Function to handle new user registration
-- POST /auth/signup - Create new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
