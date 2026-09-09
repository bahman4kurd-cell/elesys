-- Creates or resets the admin login inside Supabase Auth without the service_role key.
-- Invoked by the GitHub workflow as:  psql -v admin_email=... -v admin_password=... -f this_file
SELECT set_config('app.admin_email', :'admin_email', false);
SELECT set_config('app.admin_password', :'admin_password', false);

DO $$
DECLARE
  v_email text := lower(current_setting('app.admin_email'));
  v_pass  text := current_setting('app.admin_password');
  v_uid   uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change, is_sso_user
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_pass, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
      '', '', '', '', false
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_uid, v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );

    RAISE NOTICE 'Admin user created: %', v_email;
  ELSE
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(v_pass, extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_uid;

    RAISE NOTICE 'Admin password updated: %', v_email;
  END IF;
END $$;
