/*
  # Add test account for development

  1. New Data
    - Add manager account with employee number 1001
    - Username: 1001
    - Password will be set via Supabase Auth
    - Role: manager
    - Access to both departments

  2. Security
    - Account will use Supabase Auth for password management
    - RLS policies already in place for user management
*/

-- Insert test manager account
INSERT INTO users (
  employee_number,
  username,
  name,
  role,
  is_first_login,
  temporary_code,
  boards,
  created_at,
  updated_at
) VALUES (
  '1001',
  '1001',
  'Test Manager',
  'manager',
  false,
  NULL,
  '["voorwinkel", "achterwinkel"]'::jsonb,
  now(),
  now()
) ON CONFLICT (employee_number) DO NOTHING;

-- Note: The password 'manager123' needs to be set via Supabase Auth
-- This will be handled by the application when the user first logs in
-- or can be set manually in the Supabase dashboard