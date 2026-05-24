export const createSchemaSql = `
CREATE TABLE IF NOT EXISTS dailies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  daily_date TEXT NOT NULL DEFAULT CURRENT_DATE,
  project_id TEXT,
  project TEXT,
  summary TEXT,
  yesterday TEXT,
  today TEXT,
  blockers TEXT,
  discussions TEXT,
  decisions TEXT,
  next_steps TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_people (
  project_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  PRIMARY KEY(project_id, person_id),
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_people (
  daily_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  PRIMARY KEY(daily_id, person_id),
  FOREIGN KEY(daily_id) REFERENCES dailies(id) ON DELETE CASCADE,
  FOREIGN KEY(person_id) REFERENCES people(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS daily_tags (
  daily_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY(daily_id, tag_id),
  FOREIGN KEY(daily_id) REFERENCES dailies(id) ON DELETE CASCADE,
  FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id TEXT PRIMARY KEY,
  daily_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  position INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY(daily_id) REFERENCES dailies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dailies_created_at ON dailies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dailies_project ON dailies(project);
CREATE INDEX IF NOT EXISTS idx_project_people_person_id ON project_people(person_id);
CREATE INDEX IF NOT EXISTS idx_daily_people_person_id ON daily_people(person_id);
CREATE INDEX IF NOT EXISTS idx_daily_tags_tag_id ON daily_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_daily_id ON daily_tasks(daily_id);
`
