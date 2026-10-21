-- v001: initial PostgreSQL schema. Non-destructive bootstrap; do not drop tables.
BEGIN;

CREATE TABLE IF NOT EXISTS care_accounts (
	id VARCHAR(80) NOT NULL, 
	profile JSON NOT NULL, 
	password_hash TEXT NOT NULL, 
	active_run VARCHAR(36) NOT NULL, 
	normal_run VARCHAR(36) NOT NULL, 
	public_id VARCHAR(36) NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (public_id)
);

ALTER TABLE care_accounts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE care_accounts FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS care_devices (
	id VARCHAR(80) NOT NULL, 
	account_id VARCHAR(80) NOT NULL, 
	kind VARCHAR(16) NOT NULL, 
	token_hash VARCHAR(64) NOT NULL, 
	last_seen INTEGER, 
	generation VARCHAR(36) NOT NULL, 
	applied_revision VARCHAR(100) NOT NULL, 
	applied_color VARCHAR(16) NOT NULL, 
	applied_at INTEGER, 
	diagnostics JSON NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(account_id) REFERENCES care_accounts (id)
);

CREATE INDEX IF NOT EXISTS ix_care_devices_account_id ON care_devices (account_id);

ALTER TABLE care_devices ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE care_devices FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS care_runs (
	id VARCHAR(36) NOT NULL, 
	account_id VARCHAR(80) NOT NULL, 
	demo BOOLEAN NOT NULL, 
	state JSON NOT NULL, 
	created_at INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(account_id) REFERENCES care_accounts (id)
);

CREATE INDEX IF NOT EXISTS ix_care_runs_account_id ON care_runs (account_id);

ALTER TABLE care_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE care_runs FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS care_sessions (
	token_hash VARCHAR(64) NOT NULL, 
	account_id VARCHAR(80) NOT NULL, 
	expires_at INTEGER NOT NULL, 
	PRIMARY KEY (token_hash), 
	FOREIGN KEY(account_id) REFERENCES care_accounts (id)
);

CREATE INDEX IF NOT EXISTS ix_care_sessions_account_id ON care_sessions (account_id);

ALTER TABLE care_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE care_sessions FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS care_events (
	device_id VARCHAR(80) NOT NULL, 
	event_id VARCHAR(80) NOT NULL, 
	run_id VARCHAR(36) NOT NULL, 
	payload JSON NOT NULL, 
	result VARCHAR(40) NOT NULL, 
	received_at INTEGER NOT NULL, 
	PRIMARY KEY (device_id, event_id), 
	FOREIGN KEY(device_id) REFERENCES care_devices (id), 
	FOREIGN KEY(run_id) REFERENCES care_runs (id)
);

CREATE INDEX IF NOT EXISTS ix_care_events_run_id ON care_events (run_id);

ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE care_events FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS care_ledger (
	run_id VARCHAR(36) NOT NULL, 
	key VARCHAR(160) NOT NULL, 
	amount INTEGER NOT NULL, 
	created_at INTEGER NOT NULL, 
	PRIMARY KEY (run_id, key), 
	FOREIGN KEY(run_id) REFERENCES care_runs (id)
);

ALTER TABLE care_ledger ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE care_ledger FROM anon, authenticated;

COMMIT;
