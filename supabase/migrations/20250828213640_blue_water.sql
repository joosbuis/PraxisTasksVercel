/*
  # Check and create users table with test data

  1. Tables
    - Ensure users table exists with correct structure
    - Add test users for login testing
  
  2. Test Data
    - Manager account: employee_number 1001, password manager123
    - User account: employee_number 1002, password user123
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'manager')),
  temporary_code text,
  is_first_login boolean DEFAULT true,
  boards jsonb DEFAULT '["voorwinkel"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can read all user data" ON users;
CREATE POLICY "Users can read all user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Managers can manage users" ON users;
CREATE POLICY "Managers can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users users_1
      WHERE users_1.id = auth.uid() AND users_1.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users users_1
      WHERE users_1.id = auth.uid() AND users_1.role = 'manager'
    )
  );

-- Insert test users if they don't exist
INSERT INTO users (employee_number, username, name, role, is_first_login, boards)
VALUES 
  ('1001', '1001', 'Test Manager', 'manager', false, '["voorwinkel", "achterwinkel"]'::jsonb),
  ('1002', '1002', 'Test Gebruiker', 'user', false, '["voorwinkel"]'::jsonb)
ON CONFLICT (employee_number) DO NOTHING;

-- Create function to consume temporary codes
CREATE OR REPLACE FUNCTION consume_temp_code(p_employee_number text, p_code text)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users;
BEGIN
  SELECT * INTO user_record
  FROM users
  WHERE employee_number = p_employee_number
    AND temporary_code = p_code
    AND is_first_login = true;
    
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Clear the temporary code
  UPDATE users
  SET temporary_code = NULL,
      updated_at = now()
  WHERE id = user_record.id;
  
  RETURN user_record;
END;
$$;