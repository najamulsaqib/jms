type Database = any;

export function runMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_number TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      cnic TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      password TEXT NOT NULL DEFAULT '',
      reference_name TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const columns = db.prepare('PRAGMA table_info(todos)').all() as Array<{
    name: string;
  }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('name')) {
    db.exec("ALTER TABLE todos ADD COLUMN name TEXT NOT NULL DEFAULT '';");
  }
  if (!columnNames.has('reference_number')) {
    db.exec(
      "ALTER TABLE todos ADD COLUMN reference_number TEXT NOT NULL DEFAULT '';",
    );
  }
  if (!columnNames.has('cnic')) {
    db.exec("ALTER TABLE todos ADD COLUMN cnic TEXT NOT NULL DEFAULT '';");
  }
  if (!columnNames.has('email')) {
    db.exec("ALTER TABLE todos ADD COLUMN email TEXT NOT NULL DEFAULT '';");
  }
  if (!columnNames.has('password')) {
    db.exec("ALTER TABLE todos ADD COLUMN password TEXT NOT NULL DEFAULT '';");
  }
  if (!columnNames.has('reference_name')) {
    db.exec(
      "ALTER TABLE todos ADD COLUMN reference_name TEXT NOT NULL DEFAULT '';",
    );
  }
  if (!columnNames.has('status')) {
    db.exec(
      "ALTER TABLE todos ADD COLUMN status TEXT NOT NULL DEFAULT 'active';",
    );
  }
  if (!columnNames.has('notes')) {
    db.exec("ALTER TABLE todos ADD COLUMN notes TEXT NOT NULL DEFAULT '';");
  }
  if (!columnNames.has('created_at')) {
    db.exec(
      "ALTER TABLE todos ADD COLUMN created_at TEXT NOT NULL DEFAULT '';",
    );
  }
  if (!columnNames.has('updated_at')) {
    db.exec(
      "ALTER TABLE todos ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';",
    );
  }

  const fallbackNameExpression = columnNames.has('title')
    ? "trim(coalesce(title, ''))"
    : "''";

  db.exec(`
    UPDATE todos
    SET
      name = CASE
        WHEN trim(coalesce(name, '')) = '' THEN ${fallbackNameExpression}
        ELSE trim(name)
      END,
      reference_number = CASE
        WHEN trim(coalesce(reference_number, '')) = '' THEN cast(id as text)
        ELSE trim(reference_number)
      END,
      cnic = CASE
        WHEN trim(coalesce(cnic, '')) = '' THEN printf('%013d', id)
        ELSE trim(cnic)
      END,
      email = CASE
        WHEN trim(coalesce(email, '')) = '' THEN 'legacy+' || id || '@local.invalid'
        ELSE lower(trim(email))
      END,
      password = CASE
        WHEN coalesce(password, '') = '' THEN 'changeme'
        ELSE password
      END,
      reference_name = CASE
        WHEN trim(coalesce(reference_name, '')) = '' THEN 'N/A'
        ELSE trim(reference_name)
      END,
      status = CASE
        WHEN status IN ('active', 'inactive', 'late-filer') THEN status
        ELSE 'active'
      END,
      notes = coalesce(notes, ''),
      created_at = CASE
        WHEN trim(coalesce(created_at, '')) = '' THEN datetime('now')
        ELSE created_at
      END,
      updated_at = CASE
        WHEN trim(coalesce(updated_at, '')) = '' THEN datetime('now')
        ELSE updated_at
      END;
  `);

  db.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_todos_cnic_unique ON todos (cnic);',
  );
  db.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_todos_reference_number_unique ON todos (reference_number);',
  );
  db.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_todos_email_unique ON todos (email);',
  );
}
