-- Team Tracker Database Schema

-- Create roles enum
CREATE TYPE user_role AS ENUM ('Engineering Manager', 'Technical Product Owner', 'Engineer');

-- Create approval status enum
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create availability status enum
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'unavailable', 'on_leave');

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workday_id VARCHAR(100) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL,
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id, start_date)
);

-- Skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User skills table
CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
    years_experience DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

-- Capabilities table
CREATE TABLE capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team capabilities table
CREATE TABLE team_capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES capabilities(id) ON DELETE CASCADE,
    strength_level INTEGER CHECK (strength_level >= 1 AND strength_level <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, capability_id)
);

-- User availability table
CREATE TABLE user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status availability_status DEFAULT 'available',
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team hierarchy table
CREATE TABLE team_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    child_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_team_id, child_team_id)
);

-- Change requests table
CREATE TABLE change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type VARCHAR(50) NOT NULL, -- 'add_member', 'remove_member', 'move_member', 'create_team', etc.
    requester_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    user_id UUID REFERENCES users(id),
    details JSONB,
    status approval_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_team_capabilities_team_id ON team_capabilities(team_id);
CREATE INDEX idx_change_requests_status ON change_requests(status);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Insert sample data
INSERT INTO teams (name, description) VALUES 
('Platform Engineering', 'Core platform and infrastructure team'),
('Product Development', 'Main product development team'),
('Quality Assurance', 'Testing and quality assurance team');

INSERT INTO skills (name, category, description) VALUES 
('JavaScript', 'Programming', 'JavaScript programming language'),
('React', 'Frontend', 'React.js framework'),
('Node.js', 'Backend', 'Node.js runtime environment'),
('PostgreSQL', 'Database', 'PostgreSQL database management'),
('Docker', 'DevOps', 'Containerization technology'),
('AWS', 'Cloud', 'Amazon Web Services'),
('Python', 'Programming', 'Python programming language'),
('Java', 'Programming', 'Java programming language');

INSERT INTO capabilities (name, description, category) VALUES 
('Frontend Development', 'Ability to build user interfaces', 'Development'),
('Backend Development', 'Ability to build server-side applications', 'Development'),
('DevOps', 'Ability to manage infrastructure and deployments', 'Operations'),
('Testing', 'Ability to write and execute tests', 'Quality'),
('Architecture', 'Ability to design system architecture', 'Design'),
('Leadership', 'Ability to lead and mentor team members', 'Management'); 

-- User learning needs table
CREATE TABLE user_learning_needs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
); 