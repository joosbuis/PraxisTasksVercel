/*
  # Insert Manager Account Directly
  
  1. New Users
    - Insert manager account with employee number 1001
    - Set up with temporary password for first login
    
  2. Security
    - Account will be activated on first login
*/

-- Insert manager account directly
INSERT INTO users (
  id,
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
  gen_random_uuid(),
  '1001',
  '1001',
  'Manager',
  'manager',
  false,
  null,
  '["voorwinkel", "achterwinkel"]'::jsonb,
  now(),
  now()
) ON CONFLICT (employee_number) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_first_login = EXCLUDED.is_first_login,
  temporary_code = EXCLUDED.temporary_code,
  boards = EXCLUDED.boards,
  updated_at = now();