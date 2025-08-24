/*
  # Complete Praxis Tasks Database Setup

  1. New Tables
    - `users` - User accounts with employee numbers and roles
    - `tasks` - Task management with status tracking
    - `settings` - Application settings storage

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control

  3. Default Data
    - Manager account (1001/manager123)
    - Employee account (1002/user123)
*/

-- Create users table
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

-- Create tasks table
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

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_assigned_to') THEN
    CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_board') THEN
    CREATE INDEX idx_tasks_board ON tasks(board);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_status') THEN
    CREATE INDEX idx_tasks_status ON tasks(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_created_at') THEN
    CREATE INDEX idx_tasks_created_at ON tasks(created_at);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_updated_at') THEN
    CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Users policies
  DROP POLICY IF EXISTS "Users can read all user data" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Managers can manage users" ON users;
  
  -- Tasks policies
  DROP POLICY IF EXISTS "Users can read all tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
  DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
  DROP POLICY IF EXISTS "Managers can delete tasks" ON tasks;
  
  -- Settings policies
  DROP POLICY IF EXISTS "Users can read settings" ON settings;
  DROP POLICY IF EXISTS "Managers can modify settings" ON settings;
END $$;

-- Create policies for users table
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
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'manager'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'manager'
  ));

-- Create policies for tasks table
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
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'manager'
  ));

-- Create policies for settings table
CREATE POLICY "Users can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can modify settings"
  ON settings FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'manager'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'manager'
  ));

-- Insert default users (only if they don't exist)
INSERT INTO users (employee_number, username, name, role, temporary_code, is_first_login, boards)
VALUES 
  ('1001', '1001', 'Manager Account', 'manager', 'manager123', true, '["voorwinkel", "achterwinkel"]'::jsonb),
  ('1002', '1002', 'Employee Account', 'user', 'user123', true, '["voorwinkel"]'::jsonb)
ON CONFLICT (employee_number) DO NOTHING;

-- Insert default settings (only if they don't exist)
INSERT INTO settings (key, value)
VALUES 
  ('theme', '"light"'::jsonb),
  ('language', '"nl"'::jsonb),
  ('autoLogout', 'false'::jsonb),
  ('autoLogoutTime', '15'::jsonb)
ON CONFLICT (key) DO NOTHING;