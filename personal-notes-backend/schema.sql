-- Chatbot de Apoio - Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  email_encrypted TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  encryption_key_hash TEXT NOT NULL DEFAULT '',
  encryption_salt VARCHAR(64),
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  CONSTRAINT users_firebase_uid_unique UNIQUE (firebase_uid)
);

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Nova conversa',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT conversations_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- MESSAGES TABLE (Encrypted)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content_encrypted TEXT NOT NULL,
  iv VARCHAR(64) NOT NULL,
  auth_tag VARCHAR(64) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  timestamp TIMESTAMP DEFAULT NOW(),
  CONSTRAINT messages_conversation_id_fk FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- =====================================================
-- USER GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_encrypted TEXT NOT NULL,
  goal_iv VARCHAR(64) NOT NULL,
  goal_auth_tag VARCHAR(64) NOT NULL,
  description_encrypted TEXT,
  description_iv VARCHAR(64),
  description_auth_tag VARCHAR(64),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  CONSTRAINT goals_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- PROGRESS CHECK-INS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS progress_checkins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER REFERENCES user_goals(id) ON DELETE CASCADE,
  notes_encrypted TEXT,
  notes_iv VARCHAR(64),
  notes_auth_tag VARCHAR(64),
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT checkins_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT checkins_goal_id_fk FOREIGN KEY (goal_id) REFERENCES user_goals(id)
);

-- =====================================================
-- INCIDENTS TABLE (for future documentation feature)
-- =====================================================
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description_encrypted TEXT NOT NULL,
  description_iv VARCHAR(64) NOT NULL,
  description_auth_tag VARCHAR(64) NOT NULL,
  incident_date TIMESTAMP,
  evidence_urls_encrypted TEXT[], -- Array of encrypted URLs
  location_encrypted TEXT,
  location_iv VARCHAR(64),
  location_auth_tag VARCHAR(64),
  witnesses_encrypted TEXT,
  witnesses_iv VARCHAR(64),
  witnesses_auth_tag VARCHAR(64),
  police_reported BOOLEAN DEFAULT FALSE,
  medical_attention BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT incidents_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- IDENTIFIED PATTERNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS identified_patterns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL, -- 'gaslighting', 'manipulation', 'threats', 'isolation', etc.
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  identified_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT patterns_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- SECURITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS security_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- 'login', 'failed_login', 'password_change', 'data_export', etc.
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS EVENTS TABLE (Privacy-preserving)
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  user_id_hashed VARCHAR(64) NOT NULL, -- SHA-256 hash, not reversible
  metadata JSONB, -- Aggregate, non-sensitive data only
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- LOCAL RESOURCES TABLE (Delegacias, Abrigos, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS local_resources (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(50) NOT NULL, -- 'police', 'shelter', 'therapy', 'legal'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(50) DEFAULT 'Brasil',
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  available_24_7 BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- USER CONSENTS TABLE (LGPD Compliance)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_consents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- 'terms_of_service', 'privacy_policy', 'data_collection'
  accepted BOOLEAN NOT NULL,
  accepted_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  CONSTRAINT consents_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- EMERGENCY CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name_encrypted TEXT NOT NULL,
  name_iv VARCHAR(64) NOT NULL,
  name_auth_tag VARCHAR(64) NOT NULL,
  phone_encrypted TEXT NOT NULL,
  phone_iv VARCHAR(64) NOT NULL,
  phone_auth_tag VARCHAR(64) NOT NULL,
  relationship VARCHAR(50), -- 'friend', 'family', 'therapist', 'other'
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT emergency_contacts_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON user_goals(status);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON progress_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_goal_id ON progress_checkins(goal_id);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON identified_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_type ON local_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_city ON local_resources(city);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for conversations table
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for local_resources table
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON local_resources
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA - Emergency Resources (Brazil)
-- =====================================================
INSERT INTO local_resources (resource_type, name, description, phone, available_24_7, verified) VALUES
('emergency', 'Polícia Militar', 'Emergências policiais', '190', TRUE, TRUE),
('emergency', 'Central de Atendimento à Mulher', 'Atendimento especializado para mulheres em situação de violência', '180', TRUE, TRUE),
('emergency', 'CVV - Centro de Valorização da Vida', 'Apoio emocional e prevenção ao suicídio', '188', TRUE, TRUE),
('emergency', 'Disque Direitos Humanos', 'Denúncias de violações de direitos humanos', '100', TRUE, TRUE),
('emergency', 'SAMU', 'Atendimento médico de emergência', '192', TRUE, TRUE),
('police', 'Polícia Civil', 'Investigações e registro de ocorrências', '197', FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. All sensitive data (messages, goals, incidents, etc.) is stored encrypted
-- 2. Each encrypted field has corresponding iv and auth_tag fields for AES-GCM
-- 3. user_id in analytics_events is hashed (SHA-256) for privacy
-- 4. Cascading deletes ensure LGPD compliance (right to be forgotten)
-- 5. Indexes are created for optimal query performance
-- 6. PostGIS extension can be added later for location-based resource queries
