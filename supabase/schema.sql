-- ============================================================
-- CodeTown — Supabase Schema v1.0
-- 执行顺序严格按照 BACKEND_STRUCTURE §1.7
-- 在 Supabase SQL Editor 中整段粘贴运行即可
-- ============================================================

-- ============================================================
-- Step 0: 清理旧表（按外键依赖逆序 DROP）
-- ============================================================

DROP TABLE IF EXISTS library_refs CASCADE;
DROP TABLE IF EXISTS rules       CASCADE;
DROP TABLE IF EXISTS skills      CASCADE;
DROP TABLE IF EXISTS drafts      CASCADE;
DROP TABLE IF EXISTS projects    CASCADE;
DROP TABLE IF EXISTS users       CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================
-- Step 1: trigger function（users 和 drafts 共用）
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Step 2: users 表
-- ============================================================

CREATE TABLE users (
  id            UUID        PRIMARY KEY,
  email         TEXT        UNIQUE,
  phone         TEXT        UNIQUE,
  display_name  TEXT        NOT NULL DEFAULT '小匠',
  avatar_url    TEXT,
  current_level INT         NOT NULL DEFAULT 1
                            CHECK (current_level BETWEEN 1 AND 4),
  town_state    JSONB       NOT NULL DEFAULT '{"buildings":[{"level":1,"status":"unlocked","project_id":null},{"level":2,"status":"locked","project_id":null},{"level":3,"status":"locked","project_id":null},{"level":4,"status":"locked","project_id":null}]}',
  api_key_hash  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_or_phone_required CHECK (
    email IS NOT NULL OR phone IS NOT NULL
  )
);

CREATE INDEX idx_users_email ON users (email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone ON users (phone) WHERE phone IS NOT NULL;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_self_only ON users
  USING (id = auth.uid());

-- ============================================================
-- Step 3: projects 表
-- ============================================================

CREATE TABLE projects (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level         INT         NOT NULL CHECK (level BETWEEN 1 AND 4),
  name          TEXT        NOT NULL,
  spec_json     JSONB       NOT NULL,
  output_html   TEXT,
  task_dag      JSONB,
  build_log     JSONB       NOT NULL DEFAULT '[]',
  token_usage   JSONB       NOT NULL DEFAULT '{"totalInputTokens":0,"totalOutputTokens":0,"estimatedCostRMB":0,"perAgent":{}}',
  status        TEXT        NOT NULL DEFAULT 'building'
                            CHECK (status IN ('building', 'completed', 'failed')),
  share_slug    TEXT        UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_projects_user_id    ON projects (user_id);
CREATE INDEX idx_projects_user_level ON projects (user_id, level);
CREATE INDEX idx_projects_share_slug ON projects (share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX idx_projects_status     ON projects (status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_owner_only ON projects
  USING (user_id = auth.uid());

-- ============================================================
-- Step 4: drafts 表
-- ============================================================

CREATE TABLE drafts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level         INT         NOT NULL CHECK (level BETWEEN 1 AND 4),
  spec_json     JSONB       NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, level)
);

CREATE INDEX idx_drafts_user_id ON drafts (user_id);

CREATE TRIGGER drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY drafts_owner_only ON drafts
  USING (user_id = auth.uid());

-- ============================================================
-- Step 5: skills 表
-- ============================================================

CREATE TABLE skills (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  target_agent  TEXT        NOT NULL
                            CHECK (target_agent IN ('builder', 'tester', 'reviewer', 'all')),
  content       TEXT        NOT NULL,
  is_builtin    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE skills ADD CONSTRAINT skills_user_id_builtin_check CHECK (
  (is_builtin = TRUE AND user_id IS NULL) OR
  (is_builtin = FALSE AND user_id IS NOT NULL)
);

CREATE INDEX idx_skills_user_id    ON skills (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_skills_is_builtin ON skills (is_builtin);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY skills_builtin_or_owner ON skills
  USING (is_builtin = TRUE OR user_id = auth.uid());

-- ============================================================
-- Step 6: rules 表
-- ============================================================

CREATE TABLE rules (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  trigger_type  TEXT        NOT NULL
                            CHECK (trigger_type IN ('on_task_done', 'on_test_fail', 'before_deploy')),
  content       TEXT        NOT NULL,
  is_builtin    BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rules ADD CONSTRAINT rules_user_id_builtin_check CHECK (
  (is_builtin = TRUE AND user_id IS NULL) OR
  (is_builtin = FALSE AND user_id IS NOT NULL)
);

CREATE INDEX idx_rules_user_id    ON rules (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_rules_is_builtin ON rules (is_builtin);

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY rules_builtin_or_owner ON rules
  USING (is_builtin = TRUE OR user_id = auth.uid());

-- ============================================================
-- Step 7: library_refs 表
-- ============================================================

CREATE TABLE library_refs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id      UUID        REFERENCES projects(id) ON DELETE SET NULL,
  level           INT         NOT NULL CHECK (level = 4),
  source_type     TEXT        NOT NULL CHECK (source_type IN ('file', 'paste')),
  original_name   TEXT        NOT NULL,
  storage_path    TEXT,
  extracted_text  TEXT,
  char_count      INT,
  token_count     INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_library_refs_user_level ON library_refs (user_id, level);
CREATE INDEX idx_library_refs_project_id ON library_refs (project_id) WHERE project_id IS NOT NULL;

ALTER TABLE library_refs ENABLE ROW LEVEL SECURITY;
CREATE POLICY library_refs_owner_only ON library_refs
  USING (user_id = auth.uid());
