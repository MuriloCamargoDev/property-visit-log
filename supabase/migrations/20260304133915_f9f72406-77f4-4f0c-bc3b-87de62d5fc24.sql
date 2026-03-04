
CREATE OR REPLACE FUNCTION public.prevent_team_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.team IS NOT NULL AND NEW.team != OLD.team THEN
    RAISE EXCEPTION 'Team cannot be changed after registration';
  END IF;
  RETURN NEW;
END;
$$;
