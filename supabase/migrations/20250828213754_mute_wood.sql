/*
  # Fix Authentication System

  1. Database Setup
    - Ensure users table exists with correct structure
    - Add test users for login testing
    - Set up proper RLS policies
    
  2. Authentication Functions
    - Create consume_temp_code function for temporary login codes
    - Ensure proper user management functions exist
    
  3. Test Data
    - Manager account: employee_number 1001
    - User account: employee_number 1002
*/

-- Ensure users table exists with correct structure
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all user data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Managers can manage users" ON users;

-- Create RLS policies
CREATE POLICY "Users can read all user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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

-- Create or replace the consume_temp_code function
CREATE OR REPLACE FUNCTION consume_temp_code(p_employee_number text, p_code text)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record users;
BEGIN
  -- Find user with matching employee number and temporary code
  SELECT * INTO user_record
  FROM users
  WHERE employee_number = p_employee_number
    AND temporary_code = p_code
    AND is_first_login = true;
    
  -- If found, clear the temporary code
  IF FOUND THEN
    UPDATE users
    SET temporary_code = NULL,
        updated_at = now()
    WHERE id = user_record.id;
    
    -- Return the user record
    RETURN user_record;
  END IF;
  
  -- Return null if not found
  RETURN NULL;
END;
$$;

-- Insert test users if they don't exist
INSERT INTO users (employee_number, username, name, role, is_first_login, temporary_code, boards)
VALUES 
  ('1001', '1001', 'Test Manager', 'manager', false, NULL, '["voorwinkel", "achterwinkel"]'::jsonb),
  ('1002', '1002', 'Test Gebruiker', 'user', false, NULL, '["voorwinkel"]'::jsonb)
ON CONFLICT (employee_number) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_first_login = false,
  temporary_code = NULL,
  updated_at = now();

-- Ensure tasks table exists
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'needs-pickup', 'in-progress', 'completed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name text DEFAULT '',
  board text DEFAULT 'voorwinkel' CHECK (board IN ('voorwinkel', 'achterwinkel')),
  deadline date,
  activities jsonb DEFAULT '[]'::jsonb,
  started_by uuid REFERENCES users(id) ON DELETE SET NULL,
  started_by_name text,
  started_at timestamptz,
  picked_up_by uuid REFERENCES users(id) ON DELETE SET NULL,
  picked_up_by_name text,
  picked_up_at timestamptz,
  completed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  completed_by_name text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing task policies if they exist
DROP POLICY IF EXISTS "Users can read all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can delete tasks" ON tasks;

-- Create task policies
CREATE POLICY "Users can read all tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Managers can delete tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  );

-- Ensure settings table exists
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing settings policies if they exist
DROP POLICY IF EXISTS "Users can read settings" ON settings;
DROP POLICY IF EXISTS "Managers can modify settings" ON settings;

-- Create settings policies
CREATE POLICY "Users can read settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can modify settings"
  ON settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_employee_number ON users(employee_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON users(id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);