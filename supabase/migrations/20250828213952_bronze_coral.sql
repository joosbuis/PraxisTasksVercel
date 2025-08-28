/*
  # Fix login system and ensure test users exist

  1. Clean up and ensure test users exist
  2. Add RPC function for safe user lookup
  3. Ensure proper authentication flow
*/

-- First, ensure we have our test users with proper setup
DO $$
BEGIN
  -- Insert test manager if not exists
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
    'Test Manager',
    'manager',
    false,
    null,
    '["voorwinkel", "achterwinkel"]'::jsonb,
    now(),
    now()
  ) ON CONFLICT (employee_number) DO UPDATE SET
    name = 'Test Manager',
    role = 'manager',
    is_first_login = false,
    temporary_code = null,
    boards = '["voorwinkel", "achterwinkel"]'::jsonb,
    updated_at = now();

  -- Insert test user if not exists  
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
    '1002',
    '1002', 
    'Test Gebruiker',
    'user',
    false,
    null,
    '["voorwinkel"]'::jsonb,
    now(),
    now()
  ) ON CONFLICT (employee_number) DO UPDATE SET
    name = 'Test Gebruiker',
    role = 'user',
    is_first_login = false,
    temporary_code = null,
    boards = '["voorwinkel"]'::jsonb,
    updated_at = now();
END $$;

-- Create or replace the consume_temp_code function
CREATE OR REPLACE FUNCTION consume_temp_code(p_employee_number text, p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  -- Find user with matching employee number and temporary code
  SELECT * INTO user_record
  FROM users 
  WHERE employee_number = p_employee_number 
    AND temporary_code = p_code
    AND is_first_login = true;
    
  IF NOT FOUND THEN
    RETURN null;
  END IF;
  
  -- Clear the temporary code (but keep is_first_login true for password setup)
  UPDATE users 
  SET temporary_code = null, updated_at = now()
  WHERE id = user_record.id;
  
  -- Return user data
  RETURN json_build_object(
    'id', user_record.id,
    'employee_number', user_record.employee_number,
    'username', user_record.username,
    'name', user_record.name,
    'role', user_record.role,
    'boards', user_record.boards,
    'is_first_login', user_record.is_first_login
  );
END;
$$;

-- Add some sample tasks for testing
INSERT INTO tasks (
  id,
  title,
  description,
  status,
  priority,
  board,
  activities,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Test taak 1',
  'Dit is een test taak voor de voorwinkel',
  'todo',
  'medium',
  'voorwinkel',
  '[]'::jsonb,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Test taak 2', 
  'Dit is een test taak voor de achterwinkel',
  'in-progress',
  'high',
  'achterwinkel',
  '[]'::jsonb,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Add default settings
INSERT INTO settings (key, value, created_at, updated_at) VALUES
('theme', '"light"', now(), now()),
('language', '"nl"', now(), now()),
('autoLogout', 'false', now(), now()),
('autoLogoutTime', '15', now(), now())
ON CONFLICT (key) DO NOTHING;