-- Drop existing policies and tables to ensure a clean slate
-- This is crucial for idempotency and handling "already exists" errors
DROP POLICY IF EXISTS "Managers can manage users" ON public.users;
DROP POLICY IF EXISTS "Users can read all user data" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

DROP POLICY IF EXISTS "Managers can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can read all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;

DROP POLICY IF EXISTS "Managers can modify settings" ON public.settings;
DROP POLICY IF EXISTS "Users can read settings" ON public.settings;

DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- Create 'users' table
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number text NOT NULL UNIQUE,
    username text NOT NULL UNIQUE,
    name text,
    role text DEFAULT 'user'::text CHECK (role IN ('user', 'manager')),
    temporary_code text,
    is_first_login boolean DEFAULT true,
    boards jsonb DEFAULT '["voorwinkel"]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for 'users' table
CREATE UNIQUE INDEX IF NOT EXISTS users_employee_number_key ON public.users USING btree (employee_number);
CREATE UNIQUE INDEX IF NOT EXISTS users_pkey ON public.users USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON public.users USING btree (username);

-- Policies for 'users' table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage users" ON public.users
    FOR ALL
    TO authenticated
    USING (EXISTS ( SELECT 1 FROM users users_1 WHERE ((users_1.id = auth.uid()) AND (users_1.role = 'manager'::text))))
    WITH CHECK (EXISTS ( SELECT 1 FROM users users_1 WHERE ((users_1.id = auth.uid()) AND (users_1.role = 'manager'::text))));

CREATE POLICY "Users can read all user data" ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    TO authenticated
    USING ((auth.uid() = id))
    WITH CHECK ((auth.uid() = id));

-- Create 'tasks' table
CREATE TABLE public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text DEFAULT ''::text,
    status text DEFAULT 'todo'::text CHECK (status IN ('todo', 'needs-pickup', 'in-progress', 'completed')),
    priority text DEFAULT 'medium'::text CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_to_name text DEFAULT ''::text,
    board text DEFAULT 'voorwinkel'::text CHECK (board IN ('voorwinkel', 'achterwinkel')),
    deadline date,
    activities jsonb DEFAULT '[]'::jsonb,
    started_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    started_by_name text,
    started_at timestamp with time zone,
    picked_up_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    picked_up_by_name text,
    picked_up_at timestamp with time zone,
    completed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    completed_by_name text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for 'tasks' table
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks USING btree (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_board ON public.tasks USING btree (board);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks USING btree (status);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON public.tasks USING btree (updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS tasks_pkey ON public.tasks USING btree (id);

-- Policies for 'tasks' table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can delete tasks" ON public.tasks
    FOR DELETE
    TO authenticated
    USING (EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'manager'::text))));

CREATE POLICY "Users can create tasks" ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can read all tasks" ON public.tasks
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update tasks" ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create 'settings' table
CREATE TABLE public.settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for 'settings' table
CREATE UNIQUE INDEX IF NOT EXISTS settings_pkey ON public.settings USING btree (key);

-- Policies for 'settings' table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can modify settings" ON public.settings
    FOR ALL
    TO authenticated
    USING (EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'manager'::text))))
    WITH CHECK (EXISTS ( SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'manager'::text))));

CREATE POLICY "Users can read settings" ON public.settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Insert default manager user if not exists
INSERT INTO public.users (employee_number, username, name, role, temporary_code, is_first_login)
VALUES ('1001', '1001', 'Manager', 'manager', 'manager123', true)
ON CONFLICT (employee_number) DO NOTHING;

-- Insert default user if not exists
INSERT INTO public.users (employee_number, username, name, role, temporary_code, is_first_login)
VALUES ('1002', '1002', 'Gebruiker', 'user', 'user123', true)
ON CONFLICT (employee_number) DO NOTHING;
