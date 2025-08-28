/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `employee_number` (text, unique) - Personeelsnummer
      - `username` (text, unique)
      - `name` (text) - Display name
      - `role` (text) - 'manager' or 'user'
      - `boards` (jsonb) - Array of board access ['voorwinkel', 'achterwinkel']
      - `is_first_login` (boolean) - Whether user needs to set password
      - `temporary_code` (text) - One-time login code
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for authenticated users to read/update their own data
    - Add policies for managers to manage all users
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager')),
  boards jsonb NOT NULL DEFAULT '["voorwinkel"]'::jsonb,
  is_first_login boolean NOT NULL DEFAULT true,
  temporary_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Managers can read all users
CREATE POLICY "Managers can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'manager'
    )
  );

-- Managers can insert new users
CREATE POLICY "Managers can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'manager'
    )
  );

-- Managers can update all users
CREATE POLICY "Managers can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'manager'
    )
  );

-- Managers can delete users
CREATE POLICY "Managers can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'manager'
    )
  );