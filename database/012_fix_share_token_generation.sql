-- =====================================================
-- Fix teacher share token generation on Supabase
-- Version: 1.0
--
-- Problem: gen_random_bytes() is provided by pgcrypto in
-- the extensions schema, so an unqualified call fails with:
--   function gen_random_bytes(integer) does not exist
-- =====================================================

create extension if not exists pgcrypto with schema extensions;

create or replace function public.generate_teacher_share_token()
returns text
language sql
volatile
set search_path = public, extensions
as $$
  select encode(extensions.gen_random_bytes(32), 'hex');
$$;

revoke all on function public.generate_teacher_share_token() from public;
