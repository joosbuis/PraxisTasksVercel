/*
  # Safe Database Setup - Complete Reset
  
  1. Clean Setup
    - Drop all existing objects safely
    - Recreate tables with proper structure
    - Add policies only if they don't exist
    
  2. Test Data
    - Create test users with proper authentication setup
    - Add sample tasks and settings
    
  3. Security
    - Enable RLS on all tables
    - Create policies with existence checks
*/

-- Drop existing objects in correct order to avoid dependency issues
DROP POLICY IF EXISTS "Users can read all user data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Managers can manage users" ON users;

DROP POLICY IF EXISTS "Users can read all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Managers can delete tasks" ON tasks;

DROP POLICY IF EXISTS "Users can read settings" ON settings;
DROP POLICY IF EXISTS "Managers can modify settings" ON settings;

DROP FUNCTION IF EXISTS consume_temp_code(text, text);
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table
CREATE TABLE users (
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

-- Create tasks table
CREATE TABLE tasks (
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

-- Create settings table
CREATE TABLE settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_employee_number ON users(employee_number);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_board ON tasks(board);
CREATE INDEX idx_tasks_assigned_to ON users(id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read all user data"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Managers can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

-- Create RLS policies for tasks table
CREATE POLICY "Users can read all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Managers can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

-- Create RLS policies for settings table
CREATE POLICY "Users can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can modify settings"
  ON settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'manager'
    )
  );

-- Create consume_temp_code function
CREATE OR REPLACE FUNCTION consume_temp_code(p_employee_number text, p_code text)
RETURNS json AS $$
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
    RETURN NULL;
  END IF;
  
  -- Clear the temporary code (but keep is_first_login = true for password setup)
  UPDATE users 
  SET temporary_code = NULL, updated_at = now()
  WHERE id = user_record.id;
  
  -- Return user data as JSON
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add update triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert test users
INSERT INTO users (id, employee_number, username, name, role, is_first_login, boards) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '1001', '1001', 'Test Manager', 'manager', false, '["voorwinkel", "achterwinkel"]'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440002', '1002', '1002', 'Test Gebruiker', 'user', false, '["voorwinkel"]'::jsonb)
ON CONFLICT (employee_number) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_first_login = EXCLUDED.is_first_login,
  boards = EXCLUDED.boards,
  updated_at = now();

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority, board, assigned_to, assigned_to_name) VALUES
  ('Stelling A bijvullen', 'Producten aanvullen in stelling A, sectie gereedschap', 'todo', 'high', 'voorwinkel', '550e8400-e29b-41d4-a716-446655440002', 'Test Gebruiker'),
  ('Magazijn opruimen', 'Achtermagazijn organiseren en opruimen', 'in-progress', 'medium', 'achterwinkel', '550e8400-e29b-41d4-a716-446655440002', 'Test Gebruiker'),
  ('Kassa controle', 'Dagelijkse kassa controle uitvoeren', 'completed', 'high', 'voorwinkel', '550e8400-e29b-41d4-a716-446655440001', 'Test Manager')
ON CONFLICT (id) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('theme', '"light"'::jsonb),
  ('language', '"nl"'::jsonb),
  ('autoLogout', 'false'::jsonb),
  ('autoLogoutTime', '15'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();