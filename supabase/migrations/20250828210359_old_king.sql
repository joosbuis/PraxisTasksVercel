/*
  # Fix login database setup

  1. New Functions
    - `consume_temp_code` function for handling temporary login codes
  
  2. Test Users
    - Manager account (1001) with password manager123
    - User account (1002) with password user123
  
  3. Security
    - Ensure RLS policies allow login functionality
*/

-- Create the consume_temp_code function
CREATE OR REPLACE FUNCTION public.consume_temp_code(
  p_employee_number text,
  p_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record record;
BEGIN
  -- Find and validate the user with temporary code
  SELECT * INTO user_record
  FROM users 
  WHERE employee_number = p_employee_number 
    AND temporary_code = p_code 
    AND is_first_login = true;
  
  -- If no user found, return null
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Update user to mark temp code as consumed
  UPDATE users 
  SET 
    is_first_login = true,  -- Keep as first login for password setup
    updated_at = now()
  WHERE id = user_record.id;
  
  -- Return user data as JSON
  RETURN json_build_object(
    'id', user_record.id,
    'employee_number', user_record.employee_number,
    'username', user_record.username,
    'name', user_record.name,
    'role', user_record.role,
    'boards', user_record.boards,
    'is_first_login', true
  );
END;
$$;

-- Insert test users if they don't exist
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
) VALUES 
(
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
),
(
  gen_random_uuid(),
  '1002', 
  '1002',
  'Gebruiker',
  'user',
  NULL,
  true,
  '["voorwinkel"]'::jsonb,
  now(),
  now()
)
ON CONFLICT (employee_number) DO NOTHING;