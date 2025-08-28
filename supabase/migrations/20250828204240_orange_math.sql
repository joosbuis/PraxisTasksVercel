/*
  # Fix login database issues

  1. Clean up and recreate test user
    - Remove any existing user with employee number 1001
    - Create fresh user with correct settings for first login
    - Set temporary code for initial login

  2. Ensure proper RLS policies
    - Verify users table has correct policies
    - Allow public access for login verification

  3. Add consume_temp_code function if missing
    - Function to handle one-time code consumption
    - Atomic operation to prevent code reuse
*/

-- Clean up existing user if any
DELETE FROM auth.users WHERE email = '1001@praxis.local';
DELETE FROM users WHERE employee_number = '1001';

-- Create the test user with proper settings
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
  'Test Manager',
  'manager',
  'manager123',
  true,
  '["voorwinkel", "achterwinkel"]'::jsonb,
  now(),
  now()
);

-- Ensure RLS policies allow login verification
DROP POLICY IF EXISTS "Allow public read for login" ON users;
CREATE POLICY "Allow public read for login"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Create or replace the consume_temp_code function
CREATE OR REPLACE FUNCTION consume_temp_code(
  p_employee_number text,
  p_code text
)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users;
BEGIN
  -- Find and update user atomically
  UPDATE users 
  SET 
    temporary_code_used_at = now(),
    updated_at = now()
  WHERE 
    employee_number = p_employee_number 
    AND temporary_code = p_code 
    AND is_first_login = true
    AND temporary_code_used_at IS NULL
  RETURNING * INTO user_record;
  
  -- Return the user record if found and updated
  IF user_record.id IS NOT NULL THEN
    RETURN user_record;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION consume_temp_code(text, text) TO public;
GRANT EXECUTE ON FUNCTION consume_temp_code(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_temp_code(text, text) TO anon;