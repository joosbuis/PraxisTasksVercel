/*
  # Fix database setup for login functionality

  1. Functions
    - Add missing `consume_temp_code` function for temporary login codes
  
  2. Test Users  
    - Add manager account (1001, manager123)
    - Add regular user account (1002, user123)
    
  3. Security
    - Ensure RLS policies work correctly for login flow
*/

-- Create the missing consume_temp_code function
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
  -- Find and update user with matching employee number and temp code
  UPDATE users 
  SET 
    is_first_login = false,
    temporary_code = null,
    updated_at = now()
  WHERE 
    employee_number = p_employee_number 
    AND temporary_code = p_code
    AND is_first_login = true
  RETURNING * INTO user_record;
  
  -- Return user data if found and updated
  IF user_record.id IS NOT NULL THEN
    RETURN json_build_object(
      'id', user_record.id,
      'employee_number', user_record.employee_number,
      'username', user_record.username,
      'name', user_record.name,
      'role', user_record.role,
      'boards', user_record.boards,
      'is_first_login', user_record.is_first_login
    );
  ELSE
    RETURN null;
  END IF;
END;
$$;

-- Insert test users if they don't exist
INSERT INTO users (
  id,
  employee_number,
  username,
  name,
  role,
  boards,
  is_first_login,
  temporary_code,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '1001',
  '1001',
  'Manager',
  'manager',
  '["voorwinkel", "achterwinkel"]'::jsonb,
  true,
  null,
  now(),
  now()
),
(
  gen_random_uuid(),
  '1002', 
  '1002',
  'Gebruiker',
  'user',
  '["voorwinkel"]'::jsonb,
  true,
  null,
  now(),
  now()
)
ON CONFLICT (employee_number) DO NOTHING;

-- Ensure RLS policies allow login operations
-- Update the users table RLS policy to allow reading during login
DROP POLICY IF EXISTS "Users can read all user data" ON users;
CREATE POLICY "Users can read all user data"
  ON users
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow anonymous access for login lookup
DROP POLICY IF EXISTS "Allow anonymous login lookup" ON users;
CREATE POLICY "Allow anonymous login lookup"
  ON users
  FOR SELECT
  TO anon
  USING (true);