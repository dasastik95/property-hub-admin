-- Persist phone from auth signup metadata into the public profile row.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name_value TEXT;
  phone_value TEXT;
BEGIN
  display_name_value := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.user_metadata->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.user_metadata->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.user_metadata->>'name',
    split_part(NEW.email, '@', 1)
  );

  phone_value := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'phone', NEW.user_metadata->>'phone', '')), '');

  INSERT INTO public.profiles (id, email, display_name, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    display_name_value,
    phone_value,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.user_metadata->>'avatar_url')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

UPDATE public.profiles AS profiles
SET phone = NULLIF(BTRIM(COALESCE(users.raw_user_meta_data->>'phone', users.user_metadata->>'phone')), '')
FROM auth.users AS users
WHERE profiles.id = users.id
  AND profiles.phone IS NULL
  AND NULLIF(BTRIM(COALESCE(users.raw_user_meta_data->>'phone', users.user_metadata->>'phone')), '') IS NOT NULL;
