-- migrations/20260831_create_admin_settings.sql

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- seed default setting: auto_distribute = false
INSERT INTO admin_settings (key, value) VALUES ('auto_distribute', '{"enabled": false}')
  ON CONFLICT (key) DO UPDATE SET value = admin_settings.value;
