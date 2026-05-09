CREATE OR REPLACE FUNCTION public.validate_contact_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF length(trim(NEW.name)) < 1 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 1 and 100 characters';
  END IF;
  IF length(trim(NEW.phone)) < 1 OR length(NEW.phone) > 30 THEN
    RAISE EXCEPTION 'Phone must be between 1 and 30 characters';
  END IF;
  IF length(trim(NEW.email)) < 3 OR length(NEW.email) > 255 OR NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;
  IF length(trim(NEW.message)) < 1 OR length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Message must be between 1 and 2000 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_contact_submission_trigger
  BEFORE INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contact_submission();