drop extension if exists "pg_net";

drop policy "Users can update own profile" on "public"."users";

drop policy "Managers can manage users" on "public"."users";

drop policy "Users can read all user data" on "public"."users";

alter table "public"."users" drop constraint "users_employee_number_key";

alter table "public"."users" drop constraint "users_role_check";

alter table "public"."users" drop constraint "users_username_key";

alter table "public"."users" drop constraint "users_pkey";

drop index if exists "public"."users_employee_number_key";

drop index if exists "public"."users_pkey";

drop index if exists "public"."users_username_key";

alter table "public"."users" add column "temporary_code_used_at" timestamp with time zone;

CREATE UNIQUE INDEX users_employee_number_key1 ON public.users USING btree (employee_number);

CREATE UNIQUE INDEX users_pkey1 ON public.users USING btree (id);

CREATE UNIQUE INDEX users_username_key1 ON public.users USING btree (username);

alter table "public"."users" add constraint "users_pkey1" PRIMARY KEY using index "users_pkey1";

alter table "public"."users" add constraint "users_employee_number_key1" UNIQUE using index "users_employee_number_key1";

alter table "public"."users" add constraint "users_role_check1" CHECK ((role = ANY (ARRAY['user'::text, 'manager'::text]))) not valid;

alter table "public"."users" validate constraint "users_role_check1";

alter table "public"."users" add constraint "users_username_key1" UNIQUE using index "users_username_key1";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.consume_temp_code(p_employee_number text, p_code text)
 RETURNS users
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  u public.users;
begin
  -- Lock the matching row to avoid races
  select * into u
  from public.users
  where employee_number = p_employee_number
    and is_first_login = true
    and temporary_code = p_code
  for update;

  if not found then
    raise exception 'invalid_or_already_used_code';
  end if;

  update public.users
    set temporary_code = null,
        temporary_code_used_at = now(),
        updated_at = now()
  where id = u.id;

  -- Re-read updated row
  select * into u from public.users where id = u.id;
  return u;
end;
$function$
;


  create policy "settings_select_auth"
  on "public"."settings"
  as permissive
  for select
  to authenticated
using (true);



  create policy "settings_update_auth"
  on "public"."settings"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "settings_upsert_auth"
  on "public"."settings"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Allow delete for authenticated"
  on "public"."tasks"
  as permissive
  for delete
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow insert for authenticated"
  on "public"."tasks"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Allow read for authenticated"
  on "public"."tasks"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow update for authenticated"
  on "public"."tasks"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "tasks_delete_auth"
  on "public"."tasks"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "tasks_insert_auth"
  on "public"."tasks"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "tasks_select_auth"
  on "public"."tasks"
  as permissive
  for select
  to authenticated
using (true);



  create policy "tasks_update_auth"
  on "public"."tasks"
  as permissive
  for update
  to authenticated
using (true)
with check (true);



  create policy "Users: insert all (dev)"
  on "public"."users"
  as permissive
  for insert
  to public
with check (true);



  create policy "Users: update all (dev)"
  on "public"."users"
  as permissive
  for update
  to public
using (true)
with check (true);



  create policy "Managers can manage users"
  on "public"."users"
  as permissive
  for all
  to public
using ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'manager'::text))
with check ((((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'role'::text) = 'manager'::text));



  create policy "Users can read all user data"
  on "public"."users"
  as permissive
  for select
  to public
using (true);



