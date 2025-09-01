-- Task Manager Database Schema
-- Run this in your Supabase SQL editor

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM public;

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff members table
CREATE TABLE staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    staff_name TEXT NOT NULL,
    task_name TEXT NOT NULL,
    start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
    end_hour INTEGER NOT NULL CHECK (end_hour >= 1 AND end_hour <= 24),
    status TEXT NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'progress', 'completed', 'pending')),
    wbs_code TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_hour < end_hour)
);

-- Indexes for better performance
CREATE INDEX idx_tasks_date ON tasks(date);
CREATE INDEX idx_tasks_staff_name ON tasks(staff_name);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_staff_members_active ON staff_members(is_active);
CREATE INDEX idx_staff_members_user_id ON staff_members(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for staff_members table
CREATE POLICY "Anyone can view active staff members" ON staff_members
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Authenticated users can insert staff members" ON staff_members
    FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Users can update staff members they created" ON staff_members
    FOR UPDATE TO authenticated USING (
        user_id = auth.uid() OR 
        created_at > NOW() - INTERVAL '1 hour' -- Allow updates within 1 hour of creation
    );

CREATE POLICY "Users can deactivate staff members they created" ON staff_members
    FOR UPDATE TO authenticated USING (user_id = auth.uid())
    WITH CHECK (is_active = FALSE);

-- RLS Policies for tasks table
CREATE POLICY "Users can view all tasks" ON tasks
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Users can insert tasks" ON tasks
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - for testing)
-- You can remove this section if you don't want sample data

-- Note: Replace 'your-user-id' with actual user ID after creating a user
/*
INSERT INTO staff_members (name, is_active) VALUES 
    ('田中太郎', TRUE),
    ('佐藤花子', TRUE),
    ('山田次郎', TRUE),
    ('鈴木美香', TRUE),
    ('高橋健太', TRUE);
*/