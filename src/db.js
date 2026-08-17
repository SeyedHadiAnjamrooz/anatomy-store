const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "..", "store.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  system_tag TEXT NOT NULL,        -- e.g. Cardiovascular, Skeletal, Muscular, Nervous
  formats TEXT NOT NULL,           -- e.g. "FBX, OBJ, glTF"
  price_usd REAL NOT NULL,
  short_desc TEXT,
  long_desc TEXT,
  thumb_path TEXT,
  file_path TEXT NOT NULL,         -- protected file, only served after purchase
  poly_count TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  amount_usd REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | failed
  nowpayments_payment_id TEXT,
  invoice_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
`);

module.exports = db;
