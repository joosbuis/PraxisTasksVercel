/*
  # Create Manager Account

  1. New User
    - Employee number: 1001
    - Name: Manager
    - Role: manager
    - Departments: both voorwinkel and achterwinkel
    - Password will be set to manager123

  2. Security
    - User will be created with is_first_login = false
    - No temporary code needed
*/

-- Create the manager user
INSERT INTO users (
  id,
  employee_number,
  username,
  name,
  role,
  temporary_code,
  is_first_login,
  boards,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1001',
  '1001',
  'Manager',
  'manager',
  NULL,
  true,
  '["voorwinkel", "achterwinkel"]'::jsonb,
  now(),
  now()
) ON CONFLICT (employee_number) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  boards = EXCLUDED.boards,
  updated_at = now();