-- L1 persona context (KV_CTX 대체)
CREATE TABLE clone_ctx (
  clone_id   INTEGER PRIMARY KEY,
  data       TEXT    NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- L1-1 shared memory + version (KV_SHARED + KV_SHARED_VER 대체)
CREATE TABLE clone_shared (
  clone_id   INTEGER PRIMARY KEY,
  events     TEXT    NOT NULL DEFAULT '[]',
  version    INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- L2 ontology per clone+user (KV_ONT 대체)
CREATE TABLE clone_ont (
  clone_id   INTEGER NOT NULL,
  user_id    INTEGER NOT NULL,
  data       TEXT    NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (clone_id, user_id)
);
