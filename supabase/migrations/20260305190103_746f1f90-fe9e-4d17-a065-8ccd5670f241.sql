
-- Fix RLS policies: drop restrictive ones, create permissive ones
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create the trigger that was missing
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Drop the check constraint on team that blocks empty values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_team_check;

-- Backfill existing user
INSERT INTO public.profiles (user_id, full_name, team)
SELECT id, 
  COALESCE(NULLIF(raw_user_meta_data->>'full_name', ''), 'Usuário'), 
  COALESCE(NULLIF(raw_user_meta_data->>'team', ''), 'Aventador')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;
