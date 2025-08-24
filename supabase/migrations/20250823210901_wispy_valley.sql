/*
  # Initial Praxis Tasks Database Setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `employee_number` (text, unique)
      - `username` (text, unique)
      - `name` (text)
      - `role` (text, manager/user)
      - `temporary_code` (text, for first login)
      - `is_first_login` (boolean)
      - `boards` (jsonb, array of departments)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `status` (text, todo/needs-pickup/in-progress/completed)
      - `priority` (text, low/medium/high)
      - `assigned_to` (uuid, foreign key to users)
      - `assigned_to_name` (text)
      - `board` (text, voorwinkel/achterwinkel)
      - `deadline` (date)
      - `activities` (jsonb, activity log)
      - Various tracking fields for workflow
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `settings`
      - `key` (text, primary key)
      - `value` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Managers can manage users and settings
    - Users can read all data, update own profile and tasks

  3. Initial Data
    - Default manager account (1001/manager123)
    - Default user account (1002/user123)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Users policies
drop policy if exists "Users can read all user data" on users;

CREATE POLICY "Users can read all user data"
  ON users FOR SELECT
  TO authenticated
  USING (true);

drop policy if exists "Users can update own profile" on users;

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

drop policy if exists "Managers can manage users" on users;

CREATE POLICY "Managers can manage users"
  ON users FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'manager'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'manager'
  ));

-- Tasks policies
drop policy if exists "Users can read all tasks" on tasks;

CREATE POLICY "Users can read all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

drop policy if exists "Users can create tasks" on tasks;

CREATE POLICY "Users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

drop policy if exists "Users can update tasks" on tasks;

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

drop policy if exists "Managers can delete tasks" on tasks;

CREATE POLICY "Managers can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'manager'
  ));

-- Settings policies
drop policy if exists "Users can read settings" on settings;

CREATE POLICY "Users can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

drop policy if exists "Managers can modify settings" on settings;

CREATE POLICY "Managers can modify settings"
  ON settings FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'manager'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'manager'
  ));

-- Insert default accounts
INSERT INTO users (employee_number, username, name, role, temporary_code, is_first_login, boards) 
VALUES 
  ('1001', '1001', 'Manager', 'manager', 'manager123', true, '["voorwinkel", "achterwinkel"]'::jsonb),
  ('1002', '1002', 'Gebruiker', 'user', 'user123', true, '["voorwinkel"]'::jsonb)
ON CONFLICT (employee_number) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('theme', '"light"'::jsonb),
  ('language', '"nl"'::jsonb),
  ('autoLogout', 'false'::jsonb),
  ('autoLogoutTime', '15'::jsonb)
ON CONFLICT (key) DO NOTHING;